import * as fs from 'fs-extra'
import path from 'path'

import Sequelize from 'sequelize'

import { getOoniDir } from './global-path'

const debug = require('debug')('config.db')

const OONI_DIR = getOoniDir()

const DB_DIR = path.join(OONI_DIR, 'db')

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(DB_DIR, 'main.sqlite3'),
  logging: debug,
  operatorsAliases: false
})

/* Models */
export const Measurement = sequelize.define('measurement', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  date: Sequelize.DATE,
  dataUsage: Sequelize.INTEGER,
  // This is an opaque JSON that is test dependent
  summary: Sequelize.JSON,

  ip: Sequelize.STRING,
  asn: Sequelize.INTEGER,
  country: Sequelize.STRING(2),
  networkName: Sequelize.STRING,
  // The possible states of a measurements are:
  // * active, while the measurement is in progress
  // * done, when it's finished, but not necessarily uploaded
  // * uploaded, if it has been uploaded successfully
  // * processed, if the pipeline has processed the measurement
  state: {
    type: Sequelize.ENUM,
    values: ['active', 'done', 'uploaded', 'processed']
  },
  failure: Sequelize.STRING,

  reportFile: Sequelize.STRING,
  reportId: Sequelize.STRING,
  input: Sequelize.STRING
})

export const Result = sequelize.define('result', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  date: Sequelize.DATE,
  summary: Sequelize.JSON,
  done: Sequelize.BOOLEAN
})
Result.hasMany(Measurement, { as: 'Measurements' })

export const initDb = async () => {
  await fs.ensureDir(DB_DIR)
  await sequelize.sync()
}

export default initDb
