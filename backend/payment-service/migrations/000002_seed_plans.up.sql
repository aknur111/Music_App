INSERT INTO plans (slug, name, description, price_kzt, duration_days, is_active)
VALUES
    ('free',            'Free',             'Access to basic music features',                          0,     0,   true),
    ('premium_monthly', 'Premium Monthly',  'Full premium access — billed monthly',                   1990,  30,  true),
    ('premium_yearly',  'Premium Yearly',   'Full premium access — billed yearly, save over 16%',     19990, 365, true)
ON CONFLICT (slug) DO NOTHING;
