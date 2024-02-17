
// Please Enter your own credentials here 

module.exports = {
    CLIENT_ID: process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
    REDIRECT_URI: process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback/',
    AUTH_ENDPOINT: process.env.AUTH_ENDPOINT || 'https://accounts.google.com/o/oauth2/v2/auth',
    SCOPES: process.env.SCOPES || 'https://www.googleapis.com/auth/calendar.events'
  };
  

