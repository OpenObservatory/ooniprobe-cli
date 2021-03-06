const { red } = require('chalk')
module.exports = (...input) => {
  let messages = input
  if (typeof input[0] === 'object') {
    const {slug, message} = input[0]

    messages = [
      message,
      `> More details: https://ooni.io/help/errors/${slug}`
    ]
  }
  return `${red('> Error!')} ${messages.join('\n')}`
}
