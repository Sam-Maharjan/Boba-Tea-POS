-- Create a test customer user for development/testing
INSERT INTO users (user_id, google_sub, email, name, role)
VALUES (1, 'test-customer-123', 'test@customer.com', 'Test Customer', 'Customer')
ON CONFLICT (user_id) DO NOTHING;
