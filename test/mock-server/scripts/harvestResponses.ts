import { createHash } from 'https://deno.land/std@0.85.0/hash/mod.ts'
import objectHash from 'https://deno.land/x/object_hash@2.0.3.1/mod.ts'
import OnfidoApi from './onfidoApi.ts'

export const computeFileChecksum = async (
  filename: string
): Promise<string> => {
  const hash = createHash('sha1')
  const file = await Deno.open(filename)

  for await (const chunk of Deno.iter(file)) {
    console.log('chunk:', chunk)
    hash.update(chunk)
  }

  Deno.close(file.rid)
  return hash.toString()
}

export const harvestDocumentUploads = async (): Promise<
  Record<string, unknown>
> => {
  // const filename = '../../resources/passport.jpg'
  const filename = '/home/ethanify/Downloads/fail-fast/Fail-fast_CUTOFF.jpg'
  const api = new OnfidoApi()
  await api.init()

  const validations = [
    undefined,
    { detect_document: 'error' },
    {
      detect_blur: 'warn',
      detect_cutoff: 'warn',
      detect_document: 'error',
      detect_glare: 'warn',
    },
    {
      detect_document: 'error',
      detect_cutoff: 'error',
      detect_glare: 'error',
      detect_blur: 'error',
    },
  ]

  const checksum = await computeFileChecksum(filename)

  const entries = await validations
    .map(async (validation) => {
      const response = await api.uploadDocument(
        'passport',
        filename,
        validation
      )

      const hash = objectHash(validation || {})
      console.log(
        'Written response for checksum',
        checksum,
        'with validation hash',
        hash
      )
      return [hash, response]
    })
    .reduce(
      (prevPromise, curPromise) =>
        prevPromise.then((acc) => curPromise.then((cur) => [...acc, cur])),
      Promise.resolve([] as (string | Record<string, unknown>)[][])
    )

  return { [checksum]: Object.fromEntries(entries) }
}

/* Deno.writeTextFileSync(
  './responses.json',
  JSON.stringify(await harvestDocumentUploads(), null, 2)
) */

const filename = '/home/ethanify/Downloads/fail-fast/Fail-fast_CUTOFF.jpg'
const file = await Deno.readFile(filename)
const blob = new Blob([file.buffer])
console.log('blob', blob)
// const checksum = await computeFileChecksum(filename)
// console.log('checksum', checksum)
