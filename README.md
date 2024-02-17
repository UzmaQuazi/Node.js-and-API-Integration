# Node.js-and-API-Integration

Configuration:
To run this project, you'll need to set up your own Google API credentials. Follow these steps:

Create a project in the Google Developers Console.

Enable the Google Calendar API for your project.

Create OAuth 2.0 credentials and download the JSON file.

Rename the JSON file to credentials.json.

Replace the placeholder values in credentials.js with your actual credentials or set environment variables:

export CLIENT_ID='your_actual_client_id'
export CLIENT_SECRET='your_actual_client_secret'
export REDIRECT_URI='http://localhost:3000/oauth2callback/'
export AUTH_ENDPOINT='https://accounts.google.com/o/oauth2/v2/auth'
export SCOPES='https://www.googleapis.com/auth/calendar.events'
