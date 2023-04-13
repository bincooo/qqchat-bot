import schedule from 'node-schedule'

async function main() {
  schedule.scheduleJob('obtain-accessToken-job', '30 * * * * *', async () => {
    console.log('node-schedule running ...')
  })
}

main()