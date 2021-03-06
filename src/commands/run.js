import mri from 'mri'
import range from 'lodash.range'
import moment from 'moment'

import chalk from 'chalk'
import info from '../cli/output/info'
import header from '../cli/output/header'
import error from '../cli/output/error'

import optionPad from '../cli/output/option-pad'

import exit from '../util/exit'

import camelCase from 'camelcase'
import { nettestTypes, makeOoni } from '../nettests'

import {
  Result
} from '../config/db'

import makeCli from '../cli/make-cli'

const debug = require('debug')('commands.run')

const help = () => {
  const options = [
      {
        option: '-h, --help',
        description: 'Display usage information'
      }
  ]

  const nettestOptions = Object.keys(nettestTypes).map(name => ({
    option: chalk.bold(name),
    description: nettestTypes[name].shortDescription
  }))

  console.log(`
  ${header}

  ${chalk.dim('Usage:')}

    ooni run [options] <test | ooni:// | https://run.ooni.io/>

  ${chalk.dim('Available Tests:')}

    ${nettestOptions.map((opt) => optionPad(opt, 80)).join('\n    ')}

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt, 80)).join('\n    ')}

`)
}

const run = async ({camelName, argv}) => {
  const nettestType = nettestTypes[camelName]
  debug('nettestType', nettestType, camelName)

  const sOrNot = nettestType.nettests.length > 1 ? 's' : '';
  let dbOperations = []
  let result = Result.build({
    name: camelName,
    startTime: moment.utc().toDate(),
    done: false
  })
  dbOperations.push(result.save())

  console.log(info('Running '+
              chalk.bold(`${nettestType.nettests.length} ${nettestType.name} `) +
              `test${sOrNot}`))

  for (const nettestLoader of nettestType.nettests) {
    const loader = nettestLoader()
    const { nettest, meta } = loader
    console.log(info(`${chalk.bold(meta.name)}`))
    const measurements = await nettest.run({ooni: makeOoni(loader), argv})
    nettest.renderSummary(measurements, {
      Cli: makeCli(),
      chalk: chalk,
      Components: null,
      React: null,
    })
    dbOperations.push(result.setMeasurements(measurements))
  }
  await Promise.all(dbOperations)

  const measurements = await result.getMeasurements()
  await result.update({
    summary: nettestType.makeSummary(measurements),
    endTime: moment.utc().toDate(),
    done: true
  })
}

// Define these as module level variables so we don't have to pass them along
const main = async ctx => {
  let subcommand
  let argv = mri(ctx.argv.slice(2), {
    boolean: ['help'],
    alias: {
      help: 'h'
    }
  })

  argv._ = argv._.slice(1)
  subcommand = argv._[0]

  debug('subcommand', subcommand)
  debug('argv', argv)
  debug('argv._[1]', argv._[1])

  if (subcommand === 'run' && argv.help) {
     if (argv._[1]) {
      // if help flag has been passed without minus prefix
      // increment subcommand argument index
      subcommand = argv._[1]
    } else {
      // if this is the case then it means we should show the help
      help()
      await exit(0)
    }
  } else if (!subcommand) {
    // When `--help` is passed we only show the general help when no subcommand
    // is present (second statement for when help has been used without minux prefix)
    help()
    await exit(0)
  }
  try {
    const camelName = camelCase(subcommand)
    if (!nettestTypes[camelName]) {
      // if nettest doesn't exist show available nettests
      console.log(error(`Test "${camelName}" not found`))
      help()
      await exit(1)
      return
    }
    if (argv.help) {
      console.log(nettestTypes[camelName].help)
      await exit(0)
    } else {
      await run({camelName, argv})
    }
  } catch(err) {
    if (err.usageError) {
      console.error(error(err.message))
    } else {
      console.error(error(`Unknown error: ${err}\n${err.stack}`))
    }
    await exit(1)
  }

}

export default main
