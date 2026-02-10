import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

const LOGOS_BUCKET = 'logos';
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp'
];

const getLogoUrlKey = (userId: string) => `userLogoUrl:${userId}`;
const getLogoPathKey = (userId: string) => `userLogoPath:${userId}`;

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

export const logoService = {
  async uploadUserLogo(file: File, userId: string): Promise<{ url: string; path: string } | null> {
    try {
      if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        toast.error('Please upload a PNG, JPG, SVG, or WEBP logo');
        return null;
      }

      if (file.size > MAX_LOGO_SIZE_BYTES) {
        toast.error('Logo must be 2MB or smaller');
        return null;
      }

      const timestamp = Date.now();
      const safeName = sanitizeFileName(file.name);
      const filePath = `${userId}/logo_${timestamp}_${safeName}`;

      // Remove old logos to keep one per user
      await this.deleteUserLogos(userId);

      const { error } = await supabase.storage
        .from(LOGOS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Logo upload error:', error);
        toast.error(`Logo upload failed: ${error.message}`);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(LOGOS_BUCKET)
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;
      localStorage.setItem(getLogoUrlKey(userId), url);
      localStorage.setItem(getLogoPathKey(userId), filePath);

      return { url, path: filePath };
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
      return null;
    }
  },

  getCachedLogoUrl(userId: string): string | null {
    return localStorage.getItem(getLogoUrlKey(userId));
  },

  async getUserLogoUrl(userId: string): Promise<string | null> {
    const cached = this.getCachedLogoUrl(userId);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.storage
        .from(LOGOS_BUCKET)
        .list(userId, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Logo list error:', error);
        return null;
      }

      const latest = data?.[0];
      if (!latest) return null;

      const filePath = `${userId}/${latest.name}`;
      const { data: urlData } = supabase.storage
        .from(LOGOS_BUCKET)
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;
      localStorage.setItem(getLogoUrlKey(userId), url);
      localStorage.setItem(getLogoPathKey(userId), filePath);

      return url;
    } catch (error) {
      console.error('Logo fetch error:', error);
      return null;
    }
  },

  async deleteUserLogos(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(LOGOS_BUCKET)
        .list(userId);

      if (error) {
        console.error('Logo list error:', error);
        return false;
      }

      const files = (data || []).map(item => `${userId}/${item.name}`);
      if (files.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(LOGOS_BUCKET)
          .remove(files);

        if (deleteError) {
          console.error('Logo delete error:', deleteError);
          return false;
        }
      }

      localStorage.removeItem(getLogoUrlKey(userId));
      localStorage.removeItem(getLogoPathKey(userId));

      return true;
    } catch (error) {
      console.error('Logo delete error:', error);
      return false;
    }
  }
};

export default logoService;
