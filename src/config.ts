
export const config = {
  debug: false,
  docker: false,
  adminQQ: 0,
  botQQ: 0,
  botNickname: '猫小爱',
  botPassword: '',
  type: "mirai",
  oicq: {
    platform: 5
  },
  mirai: {
    yaml: "mirai-setting.yml"
  },

  // handler config...
  openaiOfficialAPI: {

    enable: false,
    key: '',
    model: 'text-davinci-003',
    identity: [],
    maxTokens: 256,
    maxTrackCount: 1,
    temperature: 0.9,
    stop: ['Humen', 'AI']
  },
  openaiWebAPI: {

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
  // groupPingMs: 1000 * 60 * 60,
  // groupList: { },
  // clash: {
  //   enable: false
  // },
  parseMinimum: 80,

  chatApi: null
}

export const preset: any = {
  active: "",
  maintenance: false
}


export const lang: any = {
  jp: '日语:ja-JP-MayuNeural',
  ntJp: '日语童声:ja-JP-AoiNeural',
  cn: '邻居女生:zh-CN-XiaoyiNeural:affectionate',
  cnCn: '西南话:zh-CN-sichuan-YunxiNeural',
  twCn: '台湾话:zh-TW-HsiaoChenNeural::6',
  ntCn: '小双童声:zh-CN-XiaoshuangNeural:chat',
  dbCn: '东北话:zh-CN-liaoning-XiaobeiNeural',
  gdCn: '广东话:yue-CN-XiaoMinNeural',
  en: '英语:en-GB-MaisieNeural',
}