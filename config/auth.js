module.exports = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    SCOPE: [
            'streaming',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-top-read',
            'user-read-playback-position',
            'user-read-currently-playing',
            'user-read-recently-played',
            'user-read-email'
        ]
}
