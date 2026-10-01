import { createError, defineEventHandler, getRouterParam } from 'h3'
import { FormRepository } from '~/server/repository/formRepository'

export default defineEventHandler(async (event) => {
  const formId = getRouterParam(event, 'id')

  if (!formId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Form ID wajib diisi'
    })
  }

  const form = await FormRepository.findById(formId)

  if (!form) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Form tidak ditemukan'
    })
  }

  return {
    success: true,
    data: form
  }
})