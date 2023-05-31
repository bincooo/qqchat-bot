const fs = require('fs/promises')
const { readFile, writeFile, copyFile } = fs
const path = require('path')


async function patch () {
  await fs.mkdir('build', { recursive: true })
  await fs.mkdir('build/tmp', { recursive: true })
  const ffmpeg = 'node_modules/fluent-ffmpeg/index.js'
  const ffmpegContent = `module.exports = ${process.env.FLUENTFFMPEG_COV ? "require('./lib-cov/fluent-ffmpeg');" : "require('./lib/fluent-ffmpeg');" }`
  await writeFile(ffmpeg, ffmpegContent)
  await copyFolder('conf', 'build/conf')
  await copyFolder('node_modules/wx-voice/silk', 'build/silk')
  await fs.mkdir('build/tmp', { recursive: true })
  await copyFile('loading.gif', 'build/loading.gif')
  await copyFile('mirai-setting.yml', 'build/mirai-setting.yml')
  await copyFile('node_modules/@dqbd/tiktoken/tiktoken_bg.wasm', 'build/tiktoken_bg.wasm')

  await copyFile('docker-entrypoint-binary.sh', 'build/docker-entrypoint.sh')
  await copyFile('Dockerfile-binary', 'build/Dockerfile')
  console.log('patch...')
}
async function unpatch () {
  const ffmpeg = 'node_modules/fluent-ffmpeg/index.js'
  const ffmpegContent = `module.exports = process.env.FLUENTFFMPEG_COV ? require('./lib-cov/fluent-ffmpeg') : require('./lib/fluent-ffmpeg');`
  await writeFile(ffmpeg, ffmpegContent)
  console.log('unpatch...')
}

async function fix() {
  const AppJS = (await readFile('build/app.js')).toString()
   await writeFile('build/app.js', AppJS
    .replaceAll('resolve(__dirname, "silk", type2)', 'resolve(process.cwd(), "silk", type2)')
    .replaceAll('require("path").join(__dirname, "tiktoken_bg.wasm")', 'require("path").join(process.cwd(), "tiktoken_bg.wasm")')
  )
}


async function copyFolder(source, target) {
  try {
    await fs.mkdir(target, { recursive: true })

    const files = await fs.readdir(source)

    for (const file of files) {
      const srcPath = path.join(source, file)
      const destPath = path.join(target, file)

      const stat = await fs.lstat(srcPath)

      if (stat.isDirectory()) {
        await copyFolder(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  } catch (err) {
    console.error(`Error copying folder:$${err}`)
  }
}


async function build () {
  await patch()
  require('esbuild').build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'build/app.js',
    platform: 'node',
    minify: false,
    external: [],
    plugins: []
  }).then(async (res) => {
    console.log('builded app.js..')
    await fix()
    require('pkg').exec('.')
  }).then(() => {
    unpatch()
  }).catch(() => {
    unpatch()
    process.exit(1)
  })
}
build()
