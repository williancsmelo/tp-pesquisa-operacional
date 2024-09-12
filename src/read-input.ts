import fs from 'fs'
import path from 'path'
import { InvalidInput } from './error/InvalidInput'
import { inputValidation } from './input-validation'

export const readInput = (fileName: string) => {
  let inputFileName = fileName
  if (!inputFileName) {
    console.log('Sem arquivo especificado, lendo arquivo padrão "input.json"')
    inputFileName = 'input.json'
  } else if (!inputFileName.endsWith('.json')) inputFileName += '.json'

  const filePath = path.resolve(__dirname, '../input/input.json')
  const buffer = fs.readFileSync(filePath)
  let obj
  try {
    obj = JSON.parse(buffer.toString())
  } catch (e) {
    throw new InvalidInput(`O arquivo ${inputFileName} não é um JSON válido`)
  }
  return inputValidation.validateSync(obj, { abortEarly: false })
}
