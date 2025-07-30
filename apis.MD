FMCSA API Endpoints Documentation
This documentation describes the FMCSA system endpoints for carrier management, pending documents, and automatic registration from the FMCSA database.
Authentication
Important: All FMCSA endpoints require JWT authentication with administrator profile.
Required headers:
Authorization: Bearer {jwt_token}
Content-Type: application/json
Note: The JWT token must belong to a user with administrator role. If this condition is not met, a 403 Forbidden error will be returned.
How to Authenticate and Obtain JWT Token
Before using the FMCSA endpoints, you need to authenticate and obtain a valid JWT token with administrator privileges.
Authentication Endpoint
URL: POST {API_BASE_URL}/api/login/moderator
Authentication Request
curl -X POST \
{API_BASE_URL}/api/login/moderator \
-H 'Content-Type: application/json' \
-d '{
"email": "admin@example.com",
"password": "your_password"
}'
Authentication Response
Successful Authentication (200):
{
"token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI...",
"user": {
"Id": "C4F672B6-5541-447E-93B4-4A9F5E46B22A",
"Email": "admin@example.com",
"EmailVerifiedAt": "2024-05-15 16:55:43.637",
"IdCarrier": null,
"IdDriver": null,
"OneSignalId": null,
"created_at": "2024-05-15T19:55:43.637000Z",
"updated_at": "2025-07-18T15:57:03.859000Z",
"deleted_at": null,
"LastRequirementUploadTime": null,
"IdUserStatus": 1,
"HasChangedRole": 0,
"OnboardingComplete": 0,
"OnboardingStep": 0,
"LastConnection": "2025-07-18T15:57:03.859482Z",
"IdShipper": null,
"IsActive": 1,
"IdCountry": 1,
"IdLanguage": 1,
"HashForSetPassword": null,
"roles": [
{
"Id": 1,
"Description": "Admin",
"pivot": {
"IdUser": "C4E672B6-5541-449E-93B4-4A9F6E46A29A",
"IdRole": 1
}
}
],
"user_status": {
"Id": 1,
"Description": "No upload requirements"
},
"entities": [],
"language": {
"Id": 1,
"Description": "EN"
},
"country": {
"Id": 1,
"Description": "EEUU"
}
}
}
Using the Token
Once you obtain the JWT token, include it in all FMCSA API requests:
curl -X POST \
{API_BASE_URL}/api/fmcsa/find-by-dot-email \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOi...' \
-H 'Content-Type: application/json' \
-d '{
"dot_number": "1234567",
"email": "carrier@example.com"
}'
Token Management
Token Format: JWT tokens contain the user GUID in the payload: {"id": "C4E672B6-5541-449E-93B4-4A9F6E46A29A"}
User ID: User IDs are UUIDs/GUIDs, not integers
Token Refresh: Use the refresh endpoint GET {API_BASE_URL}/api/login/{userId} to get updated user information
Role Verification: The system checks user.roles array where admin role has Id: 1 and Description: "Admin"
Driver Restriction: Users with only "driver" role are not allowed to authenticate via this endpoint
Response Format: Direct JSON response (no status or data wrapper)
Base URL
{API_BASE_URL}/api/fmcsa/
1. Find Carrier by DOT and Email
Endpoint: POST /api/fmcsa/find-by-dot-email
Description: Searches for a carrier in the FMCSA database using the provided DOT number and email.
Input parameters:
{
"dot_number": "string (required, max: 10)",
"email": "string (required, email format, max: 100)",
"language": "string (optional, values: 'en'|'es', default: 'en')"
}
Request example:
curl -X POST \
{API_BASE_URL}/api/fmcsa/find-by-dot-email \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' \
-H 'Content-Type: application/json' \
-d '{
"dot_number": "1234567",
"email": "carrier@example.com",
"language": "en"
}'
Successful responses (200):
{
"data": {
"dot_data": {
"number": "1234567",
"country": "US",
"name": "EXAMPLE TRUCKING LLC",
"email": "carrier@example.com",
"telephone": "555-123-4567",
"cellphone": "555-987-6543",
"address": "123 MAIN ST",
"city": "ANYTOWN",
"state": "TX",
"zip": "12345"
},
"is_registered_carrier": true,
"registered_carrier_data": {
"registred_email": "carrier@kargho.com",
"registered_legal_name": "Example Trucking LLC"
}
}
}
Error responses:
422 - Validation Error:
{
"error": {
"message": "The dot number field is required.",
"message_code": "FMCSA_001",
},
"error_code": 404
}
404 - Carrier Not Found:
{
"error": {
"message": "Carrier not found with the provided DOT number and email",
"message_code": "FMCSA_100"
},
"error_code": 404
}
2. Get Pending Documents
Endpoint: POST /api/fmcsa/pending-documents
Description: Gets the list of pending documents for a carrier registered in the system. The DOT country is automatically obtained from the FMCSA database.
Input parameters:
{
"dot_number": "string (required, max: 10)",
"language": "string (optional, values: 'en'|'es', default: 'en')"
}
Request example:
curl -X POST \
{API_BASE_URL}/api/fmcsa/pending-documents \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' \
-H 'Content-Type: application/json' \
-d '{
"dot_number": "1234567",
"language": "es"
}'
Successful responses (200):
{
"data": {
"dot_number": "1234567",
"country": "us",
"pending_documents_info": {
"has_pending_documents": true,
"pending_documents": [
{
"id": 1,
"code": "CDL",
"description": "Commercial Driver's License",
"priority": 1,
"status": "missing",
"reason": "Document not uploaded"
},
{
"id": 2,
"code": "VR",
"description": "Vehicle Registration",
"priority": 2,
"status": "missing",
"reason": "Document not uploaded"
}
],
"total_pending": 2
}
}
}
When no pending documents:
{
"data": {
"dot_number": "1234567",
"country": "us",
"pending_documents_info": {
"has_pending_documents": false,
"pending_documents": [],
"total_pending": 0
}
}
}
Error responses:
404 - Carrier Not Registered:
{
"error": {
"message": "Carrier is not registered in the system",
"message_code": "FMCSA_103"
},
"error_code": 404
}
500 - No Requirements Defined:
{
"error": {
"message": "No requirements defined for this country",
"message_code": "FMCSA_104"
},
"error_code": 404
}
3. Send Pending Documents Email
Endpoint: POST /api/fmcsa/send-pending-documents-email
Description: Sends an email to the carrier with the list of pending documents. The carrier's email is automatically obtained from the system database. Only sends the
email if pending documents exist.
Input parameters:
{
"dot_number": "string (required, max: 10)",
"language": "string (optional, values: 'en'|'es', default: 'en')"
}
Request example:
curl -X POST \
{API_BASE_URL}/api/fmcsa/send-pending-documents-email \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' \
-H 'Content-Type: application/json' \
-d '{
"dot_number": "1234567",
"language": "en"
}'
Successful responses (200):
With pending documents (email sent):
{
"data": {
"message": "Pending documents email sent successfully",
"email": "carrier@example.com",
"dot_number": "1234567",
"company_name": "Example Trucking LLC",
"documents_count": 3,
"email_sent": true
}
}
Without pending documents (email not sent):
{
"data": {
"message": "No pending documents found. Email not sent.",
"email": "carrier@example.com",
"dot_number": "1234567",
"company_name": "Example Trucking LLC",
"documents_count": 0,
"email_sent": false
}
}
Error responses:
404 - Carrier Not Found:
{
"error": {
"message": "Carrier not found with the provided DOT number",
"message_code": "FMCSA_100"
},
"error_code": 404
}
4. Register Carrier from FMCSA
Endpoint: POST /api/fmcsa/register-carrier
Description: Registers a new carrier in the system using FMCSA database data. Automatically sends a welcome email with access credentials. The country is
automatically obtained from the FMCSA database.
Input parameters:
{
"dot_number": "string (required, max: 10)",
"email": "string (required, email format, max: 255)",
"language": "string (optional, values: 'en'|'es', default: 'en')"
}
Request example:
curl -X POST \
{API_BASE_URL}/api/fmcsa/register-carrier \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' \
-H 'Content-Type: application/json' \
-d '{
"dot_number": "1234567",
"email": "newcarrier@example.com",
"language": "es"
}'
Successful responses (200):
{
"data": {
"message": "Carrier registered successfully",
"data": {
"user_id": 123,
"carrier_id": 456,
"dot_number": "1234567",
"email": "newcarrier@example.com",
"company_name": "New Trucking Company LLC",
"dba_name": "NTC",
"mc_number": "MC-987654",
"company_phone": "555-123-4567",
"company_email": "info@newtruck.com",
"job_address": "123 Business Ave, Houston, TX 77001",
"default_password": "abc123xy"
}
}
}
Error responses:
409 - DOT Already Registered:
{
"error": {
"message_code": "FMCSA_108",
"message": "DOT number is already registered in the system"
},
"error_code": 404
}
409 - Email Already Exists:
{
"error": {
"message_code": "FMCSA_107",
"message": "Email address is already in use"
},
"error_code": 404
}
404 - DOT Details Not Found:
{
"error": {
"message_code": "FMCSA_106",
"message": "DOT number details not found in FMCSA database"
},
"error_code": 404
}
Common Error Codes
Validation Errors (422):
FMCSA_001 : DOT number is required
FMCSA_002 : DOT number must be a string
FMCSA_003 : DOT number maximum length exceeded
FMCSA_004 : Email is required
FMCSA_005 : Email format is invalid
FMCSA_006 : Email maximum length exceeded
Business Logic Errors:
FMCSA_100 : Carrier not found
FMCSA_103 : Carrier not registered in system
FMCSA_104 : No requirements defined for country
FMCSA_105 : DOT number not found in FMCSA database
FMCSA_106 : DOT number details not found in FMCSA database
FMCSA_107 : Email already exists
FMCSA_108 : DOT already registered
Server Errors (500):
FMCSA_102 : Internal server error
Automatic Country Configuration
Important: All endpoints automatically obtain the country from the FMCSA.dbo.FMCSADots.phyCountry table:
Country codes are stored in uppercase in the database (US, AR, etc.)
They are automatically converted to lowercase for processing (us, ar, etc.)
If the country is not found, 'us' is assumed by default
Supported Country Mapping:
us (1): United States
ar (2): Argentina
Development Considerations
1. Authentication: All endpoints require JWT with administrator role
2. Languages: Supports English ('en') and Spanish ('es')
3. Emails: Emails are sent in the specified language using multilingual templates
4. Logging: All errors are logged in the system logs
5. Validation: Email format, DOT number length, etc. are validated
6. Automation: Country and carrier emails are automatically obtained from the database
Testing
All endpoints are prepared for testing. It is recommended to use specific test data and verify both successful and error cases.