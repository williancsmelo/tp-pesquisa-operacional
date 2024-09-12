import * as yup from 'yup'
import { TEMPO_POR_TURNO } from './config'

export const inputValidation = yup.object().shape({
  funcionarios: yup
    .array()
    .min(1)
    .of(
      yup.object().shape({
        nome: yup.string(),
        salario: yup.number().min(0).required(),
        tempoMaximo: yup.number().min(0).required(),
        experiente: yup.boolean().required()
      })
    )
    .required(),
  dias: yup.number().min(1).required(),
  turnos: yup
    .array()
    .min(1)
    .max(24 / TEMPO_POR_TURNO)
    .of(
      yup.object().shape({
        minimoFuncionarios: yup.number().min(1).required()
      })
    )
    .required()
})

export type Input = yup.InferType<typeof inputValidation>
