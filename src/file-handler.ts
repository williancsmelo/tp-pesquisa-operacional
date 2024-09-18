import fs from 'fs'
import path from 'path'
import { InvalidInput } from './error/InvalidInput'
import { inputValidation } from './input-validation'
import { Output } from './transform-result'

export const readInput = (fileName: string) => {
  let inputFileName = fileName
  if (!inputFileName) {
    console.log('Sem arquivo especificado, lendo arquivo padrão "input.json"')
    inputFileName = 'input.json'
  } else if (!inputFileName.endsWith('.json')) inputFileName += '.json'

  const filePath = path.join(process.cwd(), `/input/${inputFileName}`)
  console.log(`Lendo arquivo de entrada "${filePath}"`)
  const buffer = fs.readFileSync(filePath)
  let obj
  try {
    obj = JSON.parse(buffer.toString())
  } catch (e) {
    throw new InvalidInput(`O arquivo ${inputFileName} não é um JSON válido`)
  }
  return inputValidation.validateSync(obj, { abortEarly: false })
}

export const writeOutput = (fileName: string, data: Output) => {
  let outputFileName = fileName
  if (!outputFileName) {
    console.log('Sem arquivo especificado, escrevendo arquivo padrão "output.json"')
    outputFileName = 'output.json'
  } else if (!outputFileName.endsWith('.json')) outputFileName += '.json'
  const filePath = path.join(process.cwd(), `/output/${outputFileName}`)
  console.log(`Escrevendo resultados no arquivo "${filePath}"`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}
