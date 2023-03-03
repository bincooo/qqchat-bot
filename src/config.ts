
export const config = {
  debug: false,
  docker: false,
  adminQQ: 0,
  botQQ: 0,
  botNickname: '猫小爱',
  botPassword: '',
  oicq: {
    platform: 5
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
        "email": "",
        "password": ""
      }
    ],
    // browserPath: '',
    proxyServer: 'http://master.io:7890',
    pingMs: 60000 * 5,
    betterPic: false
  },
  tts: false
}

export const preset: any = {
  active: "",
  maintenance: false
}
