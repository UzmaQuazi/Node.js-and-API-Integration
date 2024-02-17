const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const credentials = require('./credentials'); // Import credentials from credentials.js
const port = 3000;


const CLIENT_ID = credentials.CLIENT_ID;
const CLIENT_SECRET = credentials.CLIENT_SECRET;
const REDIRECT_URI = credentials.REDIRECT_URI;
const AUTH_ENDPOINT = credentials.AUTH_ENDPOINT;
const SCOPES = credentials.SCOPES;


let accessToken;
let fetchedActivity = '';

const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.url}`);
    const { pathname } = url.parse(req.url);

    if (pathname === '/') {
        console.log('Serving home page');
        serveHomePage(res);
    } else if (pathname === '/fetchActivity') {
        console.log('Fetching activity from Bored API');
        fetchActivityFromBoredAPI((err) => {
            if (err) {
                sendError(res, 'Error fetching activity');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<h1>Activity: ${fetchedActivity}</h1><button onclick="window.location.href='/addToGoogleCalendar'">Add to Google Calendar</button>`);
            }
        });
    } else if (pathname === '/addToGoogleCalendar') {
        console.log('Adding to Google Calendar');
        if (!accessToken) {
            console.log('Redirecting to Google Auth');
            redirectToGoogleAuth(res);
        } else {
            addToGoogleCalendar((err) => {
                if (err) {
                    sendError(res, 'Error adding to Google Calendar');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<h1>Activity added to Google Calendar</h1>');
                }
            });
        }
    } else if (pathname === '/oauth2callback/') {
        console.log('Handling OAuth2 callback');
        handleGoogleCallback(req, res);
    } else {
        console.log('Page not found');
        sendNotFound(res);
    }
});

function serveHomePage(res) {
    fs.readFile('./index.html', (error, data) => {
        if (error) {
            sendError(res, 'Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
}

function fetchActivityFromBoredAPI(callback) {
    const boredApiUrl = 'https://www.boredapi.com/api/activity';
    https.get(boredApiUrl, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => {
            body += chunk;
        });
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(body);
                fetchedActivity = result.activity;
                callback(null);
            } catch (err) {
                callback(err);
            }
        });
    }).on('error', (err) => {
        callback(err);
    });
}

function addToGoogleCalendar(callback) {
    console.log('Processing addition to Google Calendar');
    const eventData = {
        summary: fetchedActivity,
        start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
        end: { dateTime: new Date(new Date().getTime() + 3600000).toISOString(), timeZone: 'UTC' }
    };

    const calendarEndpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };

    const calendarRequest = https.request(calendarEndpoint, options, (calendarRes) => {
        let body = '';
        calendarRes.on('data', (chunk) => {
            body += chunk;
            console.log('Receiving response from Google Calendar API');
        });
        calendarRes.on('end', () => {
            console.log('Response received from Google Calendar API');
            if (calendarRes.statusCode === 200) {
                callback(null);
            } else {
                console.error(`Error adding event to Google Calendar: ${calendarRes.statusCode}`);
                callback(new Error('Error adding event to Google Calendar'));
            }
        });
    });

    calendarRequest.on('error', (error) => {
        console.error(`Error: ${error.message}`);
        callback(error);
    });

    calendarRequest.write(JSON.stringify(eventData));
    calendarRequest.end();
}

function redirectToGoogleAuth(res) {
    const authUrl = `${AUTH_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&access_type=offline&prompt=consent`;
    console.log('Redirect URL:', authUrl);
    res.writeHead(302, { 'Location': authUrl });
    res.end();
}

function handleGoogleCallback(req, res) {
    const { query } = url.parse(req.url);
    const params = querystring.parse(query);
    console.log('Received code:', params.code);
    getAccessToken(params.code, res);
}

function getAccessToken(code, res) {
    console.log('Getting access token');
    const postData = querystring.stringify({
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
    });

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        hostname: 'oauth2.googleapis.com',
        path: '/token'
    };

    const tokenReq = https.request(options, (tokenRes) => {
        let data = '';
        tokenRes.on('data', (chunk) => {
            data += chunk;
            console.log('Receiving token data');
        });
        tokenRes.on('end', () => {
            console.log('Token data received');
            accessToken = JSON.parse(data).access_token;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h1>Access Granted</h1><button onclick="window.location.href='/'">Fetch Activity</button>`);
        });
    });

    tokenReq.on('error', (err) => {
        console.error('Error getting access token:', err.message);
        res.writeHead(500);
        res.end('Error getting access token');
    });

    tokenReq.write(postData);
    tokenReq.end();
}

function sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
}

function sendError(res, message) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(message);
}

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});