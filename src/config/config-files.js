import { readFileSync, writeFileSync } from 'fs'

import path from 'path'

import { getOoniDir } from './global-path'

const OONI_DIR = getOoniDir()
const CONFIG_FILE_PATH = path.join(OONI_DIR, 'config.json')

export const prettify = obj => JSON.stringify(obj, null, 2)

export const readConfigFile = () => readFileSync(CONFIG_FILE_PATH, 'utf8')

export const writeToConfigFile = obj => writeFileSync(CONFIG_FILE_PATH, prettify(obj))

export const getConfigFilePath = () => CONFIG_FILE_PATH
