
export const config = {

  adminQQ: 0,
  botQQ: 0,
  botPassword: '',
  oicq: {
    platform: 1
  },

  // handler config...
  officialAPI: {

    enable: false,
    key: '',
    model: 'text-davinci-003',
    identity: [],
    maxTokens: 256,
    maxTrackCount: 1,
    temperature: 0.9,
    stop: ['Humen', 'AI']
  },
  api: {

    enable: true,
    email: '',
    password: '',
    // Standby for solving "429" [1 hours error] 
    slaves: [
      {
        "email": "seket97383@bitvoo.com",
        "password": "a12345678"
      }
    ],
    browserPath: '',
    proxyServer: 'http://master.io:7890',
    pingMs: 60000 * 5
  },
  tts: false,
  client: null
}
