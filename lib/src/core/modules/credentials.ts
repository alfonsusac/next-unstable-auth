

//  Schema

export type CredentialSchemaField
  = {
    type: "text" | "number",
    internal?: boolean,
  }

export type CredentialSchema
  = Record<string, CredentialSchemaField>


//  Values

export type ToCredentialValue<C extends CredentialSchemaField>
  = C['type'] extends "text" ? string : number

export type ToCredentialValues<C extends CredentialSchema>
  = { [K in keyof C]: ToCredentialValue<C[K]> }



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



export function validateCredentialValues<C extends CredentialSchema>(
  schema: C,
  values: any
) {
  if (!values || typeof values !== 'object') throw new Error('Expected object for values')

  for (const key in schema) {
    const field = schema[key]
    if (key in values === false) throw new Error(`Missing field ${ key }`)

    const value = values[key]
    if (field.type === 'text' && typeof value !== 'string') throw new Error(`Expected string for field ${ key }`)
    if (field.type === 'number' && typeof value !== 'number') throw new Error(`Expected number for field ${ key }`)
  }

  return values as ToCredentialValues<C>
}

