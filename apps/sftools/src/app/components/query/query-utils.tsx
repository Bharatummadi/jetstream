import { describeSObject, query } from '../../utils/data';
import { MapOf, FieldDefinition, REGEX } from '@silverthorn/api-interfaces';
import { getFieldDefinitionQuery, polyfillFieldDefinition } from '../../utils/sfdc-utils';
import { getMapOf, sortQueryFields } from '../../utils/utils';
import { FieldWrapper, QueryFields } from '../../types/types';
import { Field } from 'jsforce';
import { composeQuery, getField } from 'soql-parser-js';

export function buildQuery(sObject: string, fields: string[]) {
  return composeQuery({ sObject, fields: fields.map((field) => getField(field)) }, { format: true });
}

/**
 * Fetch fields and add to queryFields
 */
export async function fetchFields(queryFields: QueryFields): Promise<QueryFields> {
  const { sobject } = queryFields;
  const [describeResults, queryResults] = await Promise.all([
    describeSObject(sobject),
    query<FieldDefinition>(getFieldDefinitionQuery(sobject), true),
  ]);

  // TODO: we can possibly remove this - roll-up fields and some others might not be optimal
  // but some objects (user) fail and it does require an additional api call - so ditching it could be a benefit
  const fieldDefByApiName: MapOf<FieldDefinition> = {};
  if (queryResults?.queryResults?.records) {
    // fieldDefByApiName = getMapOf(queryResults?.queryResults?.records, 'QualifiedApiName');
  }

  const fields: MapOf<FieldWrapper> = getMapOf(
    sortQueryFields(describeResults.fields).map((field: Field) => {
      const type = fieldDefByApiName[field.name]?.DataType || polyfillFieldDefinition(field);
      const filterText = `${field.name || ''}${field.label || ''}${type}${type.replace(REGEX.NOT_ALPHA, '')}`.toLowerCase();
      return {
        name: field.name,
        label: field.label,
        type,
        sobject,
        relatedSobject: field.type === 'reference' && field.referenceTo?.length ? field.referenceTo[0] : undefined,
        filterText,
        metadata: field,
        fieldDefinition: fieldDefByApiName[field.name],
      };
    }),
    'name'
  );

  return { ...queryFields, fields, visibleFields: new Set(Object.keys(fields)) };
}