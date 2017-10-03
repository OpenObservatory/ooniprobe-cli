const { homedir } = require('os')
const path = require('path')

const mri = require('mri')

export const getOoniDir = () => {
  const args = mri(process.argv.slice(2), {
    string: ['ooni-home']
  })

  const customPath = args['ooni-home']

  if (!customPath) {
    return path.join(homedir(), '.ooni')
  }
  return path.resolve(customPath)
}
export default getOoniDir
