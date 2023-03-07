
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
    pingMs: 60000 * 5,
    betterPic: false
  },

  // browserPath: '',
  proxyServer: 'http://master.io:7890',
  groupPingMs: 1000 * 60 * 60,
  groupList: {
  }
}

export const preset: any = {
  active: "",
  maintenance: false
}


export const lang: any = {
  jp: '日语:ja-JP-AoiNeural',
  cn: '普通话:zh-CN-XiaoshuangNeural',
  dbCn: '东北话:zh-CN-liaoning-XiaobeiNeural',
  gdCn: '广东话:yue-CN-XiaoMinNeural',
  en: '英语:en-GB-MaisieNeural',
}