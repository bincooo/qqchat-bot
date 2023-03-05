import { onlineSearch, shortURL } from '../src/util/request'

async function main() {
  // const result = await shortURL('http://bingco.zn/photo-enhancer')
  const result = await onlineSearch('2023年苹果公司的CEO是谁')
  console.log(result)
}

main()