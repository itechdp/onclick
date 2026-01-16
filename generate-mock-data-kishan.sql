-- Mock Data Generation for kishan@gmail.com
-- This script generates 100-150 records across all sections

-- Step 1: Ensure the user exists (get the user_id)
DO $$
DECLARE
  v_user_id UUID;
  v_group_head_1 UUID;
  v_group_head_2 UUID;
  v_group_head_3 UUID;
  v_group_head_4 UUID;
  i INT;
  v_policy_types TEXT[] := ARRAY['General', 'Life', 'Health', 'Vehicle', 'Property'];
  v_companies TEXT[] := ARRAY['LIC', 'ICICI Prudential Life Insurance', 'HDFC Life Insurance', 'Bajaj Allianz', 'Max Life Insurance', 'SBI Life Insurance', 'Tata AIG', 'Reliance General Insurance', 'New India Assurance', 'Oriental Insurance'];
  v_first_names TEXT[] := ARRAY['Raj', 'Amit', 'Priya', 'Neha', 'Rahul', 'Sneha', 'Vikram', 'Pooja', 'Sanjay', 'Kavita', 'Arjun', 'Divya', 'Karan', 'Anjali', 'Rohan', 'Meera', 'Aditya', 'Shreya', 'Varun', 'Ritu'];
  v_last_names TEXT[] := ARRAY['Sharma', 'Patel', 'Kumar', 'Singh', 'Mehta', 'Shah', 'Gupta', 'Joshi', 'Reddy', 'Iyer', 'Malhotra', 'Chopra', 'Desai', 'Nair', 'Agarwal', 'Verma', 'Kapoor', 'Bhat', 'Rao', 'Kulkarni'];
  v_cities TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Ahmedabad', 'Pune', 'Surat', 'Jaipur', 'Chennai', 'Kolkata', 'Hyderabad'];
  v_policy_id UUID;
  v_phone TEXT;
  v_premium DECIMAL;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Get user_id for kishan@gmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kishan@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User kishan@gmail.com not found. Please create this user first.';
  END IF;

  RAISE NOTICE 'Generating data for user_id: %', v_user_id;

  -- Step 2: Create 4 Group Heads
  INSERT INTO public.group_heads (group_head_name, contact_no, email_id, relationship_type, address, notes, user_id)
  VALUES 
    ('Patel Family Group', '9876543210', 'patel.family@gmail.com', 'Family', '123 MG Road, Mumbai, Maharashtra 400001', 'Primary family group with multiple policies', v_user_id)
  RETURNING id INTO v_group_head_1;

  INSERT INTO public.group_heads (group_head_name, contact_no, email_id, relationship_type, address, notes, user_id)
  VALUES 
    ('Shah Corporate Group', '9876543211', 'shah.corp@gmail.com', 'Corporate', '456 Sardar Patel Road, Ahmedabad, Gujarat 380009', 'Corporate client with employee policies', v_user_id)
  RETURNING id INTO v_group_head_2;

  INSERT INTO public.group_heads (group_head_name, contact_no, email_id, relationship_type, address, notes, user_id)
  VALUES 
    ('Mehta Extended Family', '9876543212', 'mehta.family@gmail.com', 'Family', '789 Park Street, Pune, Maharashtra 411001', 'Extended family insurance coverage', v_user_id)
  RETURNING id INTO v_group_head_3;

  INSERT INTO public.group_heads (group_head_name, contact_no, email_id, relationship_type, address, notes, user_id)
  VALUES 
    ('Kumar Business Associates', '9876543213', 'kumar.business@gmail.com', 'Corporate', '321 Brigade Road, Bangalore, Karnataka 560001', 'Business partnership insurance group', v_user_id)
  RETURNING id INTO v_group_head_4;

  RAISE NOTICE 'Created 4 Group Heads';

  -- Step 3: Generate 120 Policies (30 per group head + 30 individual)
  -- Group 1: 30 Policies
  FOR i IN 1..30 LOOP
    v_phone := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    v_premium := (RANDOM() * 90000 + 10000)::DECIMAL(10,2);
    v_start_date := CURRENT_DATE - (RANDOM() * 730)::INT;
    v_end_date := v_start_date + (365 * (1 + (RANDOM() * 2)::INT));
    
    INSERT INTO public.policies (
      user_id, policyholder_name, policy_number, policy_type, insurance_company,
      premium_amount, policy_start_date, policy_end_date, contact_no,
      address, notes, member_of
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'POL-PF-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0'),
      v_policy_types[(i % 5) + 1],
      v_companies[(i % 10) + 1],
      v_premium,
      v_start_date,
      v_end_date,
      v_phone,
      (i * 10) || ' Street, ' || v_cities[(i % 10) + 1] || ', India ' || (400000 + i),
      'Policy for Patel Family Group member',
      v_group_head_1
    );
  END LOOP;
  RAISE NOTICE 'Created 30 policies for Group Head 1';

  -- Group 2: 30 Policies
  FOR i IN 31..60 LOOP
    v_phone := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    v_premium := (RANDOM() * 90000 + 10000)::DECIMAL(10,2);
    v_start_date := CURRENT_DATE - (RANDOM() * 730)::INT;
    v_end_date := v_start_date + (365 * (1 + (RANDOM() * 2)::INT));
    
    INSERT INTO public.policies (
      user_id, policyholder_name, policy_number, policy_type, insurance_company,
      premium_amount, policy_start_date, policy_end_date, contact_no,
      address, notes, member_of
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'POL-SC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0'),
      v_policy_types[(i % 5) + 1],
      v_companies[(i % 10) + 1],
      v_premium,
      v_start_date,
      v_end_date,
      v_phone,
      (i * 10) || ' Avenue, ' || v_cities[(i % 10) + 1] || ', India ' || (400000 + i),
      'Policy for Shah Corporate Group',
      v_group_head_2
    );
  END LOOP;
  RAISE NOTICE 'Created 30 policies for Group Head 2';

  -- Group 3: 30 Policies
  FOR i IN 61..90 LOOP
    v_phone := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    v_premium := (RANDOM() * 90000 + 10000)::DECIMAL(10,2);
    v_start_date := CURRENT_DATE - (RANDOM() * 730)::INT;
    v_end_date := v_start_date + (365 * (1 + (RANDOM() * 2)::INT));
    
    INSERT INTO public.policies (
      user_id, policyholder_name, policy_number, policy_type, insurance_company,
      premium_amount, policy_start_date, policy_end_date, contact_no,
      address, notes, member_of
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'POL-MF-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0'),
      v_policy_types[(i % 5) + 1],
      v_companies[(i % 10) + 1],
      v_premium,
      v_start_date,
      v_end_date,
      v_phone,
      (i * 10) || ' Lane, ' || v_cities[(i % 10) + 1] || ', India ' || (400000 + i),
      'Policy for Mehta Extended Family',
      v_group_head_3
    );
  END LOOP;
  RAISE NOTICE 'Created 30 policies for Group Head 3';

  -- Group 4: 30 Policies
  FOR i IN 91..120 LOOP
    v_phone := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    v_premium := (RANDOM() * 90000 + 10000)::DECIMAL(10,2);
    v_start_date := CURRENT_DATE - (RANDOM() * 730)::INT;
    v_end_date := v_start_date + (365 * (1 + (RANDOM() * 2)::INT));
    
    INSERT INTO public.policies (
      user_id, policyholder_name, policy_number, policy_type, insurance_company,
      premium_amount, policy_start_date, policy_end_date, contact_no,
      address, notes, member_of
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'POL-KB-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0'),
      v_policy_types[(i % 5) + 1],
      v_companies[(i % 10) + 1],
      v_premium,
      v_start_date,
      v_end_date,
      v_phone,
      (i * 10) || ' Road, ' || v_cities[(i % 10) + 1] || ', India ' || (400000 + i),
      'Policy for Kumar Business Associates',
      v_group_head_4
    );
  END LOOP;
  RAISE NOTICE 'Created 30 policies for Group Head 4';

  -- Individual Policies: 30 Policies
  FOR i IN 121..150 LOOP
    v_phone := '98765' || LPAD((43210 + i)::TEXT, 5, '0');
    v_premium := (RANDOM() * 90000 + 10000)::DECIMAL(10,2);
    v_start_date := CURRENT_DATE - (RANDOM() * 730)::INT;
    v_end_date := v_start_date + (365 * (1 + (RANDOM() * 2)::INT));
    
    INSERT INTO public.policies (
      user_id, policyholder_name, policy_number, policy_type, insurance_company,
      premium_amount, policy_start_date, policy_end_date, contact_no,
      address, notes, member_of
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      'POL-IND-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0'),
      v_policy_types[(i % 5) + 1],
      v_companies[(i % 10) + 1],
      v_premium,
      v_start_date,
      v_end_date,
      v_phone,
      (i * 10) || ' Plaza, ' || v_cities[(i % 10) + 1] || ', India ' || (400000 + i),
      'Individual policy not part of any group',
      NULL
    );
  END LOOP;
  RAISE NOTICE 'Created 30 individual policies';

  -- Step 4: Generate 100 Leads
  FOR i IN 1..100 LOOP
    INSERT INTO public.leads (
      user_id, customer_name, customer_email, customer_mobile, lead_source, status, priority,
      remark, follow_up_date, next_follow_up_date, estimated_value, product_type
    ) VALUES (
      v_user_id,
      v_first_names[(i % 20) + 1] || ' ' || v_last_names[(i % 20) + 1],
      LOWER(v_first_names[(i % 20) + 1]) || '.' || LOWER(v_last_names[(i % 20) + 1]) || i || '@example.com',
      '98765' || LPAD((50000 + i)::TEXT, 5, '0'),
      CASE (i % 5)
        WHEN 0 THEN 'Referral'
        WHEN 1 THEN 'Website'
        WHEN 2 THEN 'Social Media'
        WHEN 3 THEN 'Cold Call'
        ELSE 'Walk-in'
      END,
      CASE (i % 5)
        WHEN 0 THEN 'new'
        WHEN 1 THEN 'contacted'
        WHEN 2 THEN 'qualified'
        WHEN 3 THEN 'follow_up'
        ELSE 'negotiation'
      END,
      CASE (i % 3)
        WHEN 0 THEN 'high'
        WHEN 1 THEN 'medium'
        ELSE 'low'
      END,
      'Lead ' || i || ' - Interested in ' || v_policy_types[(i % 5) + 1] || ' insurance',
      CURRENT_TIMESTAMP + (i % 30 || ' days')::INTERVAL,
      CURRENT_TIMESTAMP + ((i % 30) + 7 || ' days')::INTERVAL,
      (RANDOM() * 90000 + 10000)::DECIMAL(10,2),
      v_policy_types[(i % 5) + 1]
    );
  END LOOP;
  RAISE NOTICE 'Created 100 leads';

  -- Step 5: Generate Team Members (10 members)
  FOR i IN 1..10 LOOP
    INSERT INTO public.team_members (
      admin_user_id, email, password_hash, full_name, is_active
    ) VALUES (
      v_user_id,
      'team' || i || '.kishan@example.com',
      '$2a$10$abcdefghijklmnopqrstuv', -- Placeholder password hash
      'Team Member ' || i || ' ' || v_last_names[(i % 20) + 1],
      true
    );
  END LOOP;
  RAISE NOTICE 'Created 10 team members';

  RAISE NOTICE '======================================';
  RAISE NOTICE 'Mock Data Generation Complete!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Total Policies: 150 (120 group + 30 individual)';
  RAISE NOTICE 'Total Group Heads: 4';
  RAISE NOTICE 'Total Leads: 100';
  RAISE NOTICE 'Total Team Members: 10';
  RAISE NOTICE '======================================';
  
END $$;

-- Verify the data
SELECT 
  'Policies' as table_name, 
  COUNT(*) as record_count 
FROM public.policies 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kishan@gmail.com' LIMIT 1)
UNION ALL
SELECT 
  'Group Heads' as table_name, 
  COUNT(*) as record_count 
FROM public.group_heads 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kishan@gmail.com' LIMIT 1)
UNION ALL
SELECT 
  'Leads' as table_name, 
  COUNT(*) as record_count 
FROM public.leads 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kishan@gmail.com' LIMIT 1)
UNION ALL
SELECT 
  'Team Members' as table_name, 
  COUNT(*) as record_count 
FROM public.team_members 
WHERE admin_user_id = (SELECT id FROM auth.users WHERE email = 'kishan@gmail.com' LIMIT 1);
