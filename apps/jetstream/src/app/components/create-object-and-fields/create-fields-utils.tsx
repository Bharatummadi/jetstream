import { describeGlobal, genericRequest, queryWithCache } from '@jetstream/shared/data';
import { ensureBoolean, REGEX, splitArrayToMaxSize } from '@jetstream/shared/utils';
import { CompositeResponse, SalesforceOrgUi } from '@jetstream/types';
import { DescribeGlobalSObjectResult } from 'jsforce';
import isBoolean from 'lodash/isBoolean';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import {
  FieldDefinitionMetadata,
  FieldDefinitions,
  FieldDefinitionType,
  FieldValueDependencies,
  FieldValues,
  GlobalPicklistRecord,
  LayoutRecord,
  SalesforceFieldType,
} from './create-fields-types';
import { CreateFieldsResults } from './useCreateFields';

const READ_ONLY_TYPES = new Set<SalesforceFieldType>(['AutoNumber', 'Formula']);
const NUMBER_TYPES = new Set<SalesforceFieldType>(['Number', 'Currency', 'Percent']);

export function filterCreateFieldsSobjects(sobject: DescribeGlobalSObjectResult) {
  return (
    sobject.createable &&
    sobject.updateable &&
    !sobject.name.endsWith('__History') &&
    !sobject.name.endsWith('__Tag') &&
    !sobject.name.endsWith('__Share')
  );
}

export const fieldDefinitions: FieldDefinitions = {
  type: {
    label: 'Type',
    type: 'picklist',
    values: [
      { id: 'AutoNumber', value: 'AutoNumber', label: 'Auto-Number' },
      { id: 'Checkbox', value: 'Checkbox', label: 'Checkbox' },
      { id: 'Currency', value: 'Currency', label: 'Currency' },
      { id: 'Date', value: 'Date', label: 'Date' },
      { id: 'DateTime', value: 'DateTime', label: 'Date Time' },
      { id: 'Email', value: 'Email', label: 'Email' },
      { id: 'Formula', value: 'Formula', label: 'Formula' },
      { id: 'Lookup', value: 'Lookup', label: 'Lookup' },
      { id: 'MasterDetail', value: 'MasterDetail', label: 'Master-Detail' },
      { id: 'MultiselectPicklist', value: 'MultiselectPicklist', label: 'Multi-select Picklist' },
      { id: 'Number', value: 'Number', label: 'Number' },
      { id: 'Percent', value: 'Percent', label: 'Percent' },
      { id: 'Phone', value: 'Phone', label: 'Phone' },
      { id: 'Picklist', value: 'Picklist', label: 'Picklist' },
      { id: 'Text', value: 'Text', label: 'Text' },
      { id: 'TextArea', value: 'TextArea', label: 'Text Area' },
      { id: 'LongTextArea', value: 'LongTextArea', label: 'Text Area (Long)' },
      { id: 'Html', value: 'Html', label: 'Text Area (Rich)' },
      { id: 'Time', value: 'Time', label: 'Time' },
      { id: 'Url', value: 'Url', label: 'Url' },
    ],
    required: true,
  },
  label: {
    label: 'Label',
    type: 'text',
    required: true,
  },
  fullName: {
    label: 'Name',
    type: 'text',
    required: true,
    labelHelp: 'API name of field, cannot include more than one underscore. Do not add __c at the end.',
    validate: (value: string) => {
      if (!value || !/(^[a-zA-Z]+$)|(^[a-zA-Z]+[0-9a-zA-Z_]*[0-9a-zA-Z]$)/.test(value) || value.includes('__') || value.length > 40) {
        return false;
      }
      return true;
    },
  },
  inlineHelpText: {
    label: 'Help Text',
    type: 'text',
  },
  description: {
    label: 'Description',
    type: 'textarea',
  },
  defaultValue: {
    label: 'Default Value',
    type: (type: SalesforceFieldType) => (type === 'Checkbox' ? 'checkbox' : 'text'),
  },
  referenceTo: {
    label: 'Reference To',
    type: 'picklist',
    values: async (org) => {
      return (await describeGlobal(org)).data.sobjects
        .filter((obj) => !(obj as any).associateEntityType && obj.triggerable && obj.queryable)
        .map(({ name, label }) => ({ id: name, value: name, label: label, secondaryLabel: name }));
    },
    required: true,
  },
  deleteConstraint: {
    label: 'Related Record Deletion',
    type: 'picklist',
    values: [
      { id: 'SetNull', value: 'SetNull', label: 'Clear Value' },
      { id: 'Restrict', value: 'Restrict', label: 'Prevent Deletion' },
    ],
  },
  length: {
    label: 'Length',
    type: 'text', // number
    helpText: (type: SalesforceFieldType) => {
      if (type === 'LongTextArea' || type === 'Html') {
        return 'Max value 131072';
      }
    },
    validate: (value: string, type: SalesforceFieldType) => {
      if (!value || !/^[0-9]+$/.test(value)) {
        return false;
      }
      const numValue = Number(value);
      if (type === 'LongTextArea' || type === 'Html') {
        return isFinite(numValue) && numValue > 255 && numValue <= 131072;
      }
      return isFinite(numValue) && numValue > 0 && numValue <= 255;
    },
    required: true,
  },
  precision: {
    label: 'Length',
    type: 'text', // number
    validate: (value: string, type: SalesforceFieldType) => {
      if (!value || !/^[0-9]+$/.test(value)) {
        return false;
      }
      const numValue = Number(value);
      return isFinite(numValue) && numValue >= 0 && numValue <= 18;
    },
    required: true,
  },
  scale: {
    label: 'Decimal Places',
    type: 'text',
    validate: (value: string) => {
      if (!value || !/^[0-9]+$/.test(value)) {
        return false;
      }
      const numValue = Number(value);
      return isFinite(numValue) && numValue >= 0 && numValue <= 18;
    },
    required: true,
  },
  required: {
    label: 'Required',
    type: 'checkbox',
  },
  unique: {
    label: 'Unique',
    type: 'checkbox',
  },
  externalId: {
    label: 'External Id',
    type: 'checkbox',
  },
  valueSet: {
    label: 'Picklist Values',
    type: 'textarea',
    required: true,
  },
  globalValueSet: {
    label: 'Global Picklist',
    type: 'picklist',
    required: true,
    values: async (org) => {
      const results = await queryWithCache<GlobalPicklistRecord>(
        org,
        `SELECT Id, DeveloperName, NamespacePrefix, MasterLabel FROM GlobalValueSet ORDER BY DeveloperName ASC`,
        true
      );
      return results.data.queryResults.records.map((record) => {
        const value = `${record.NamespacePrefix ? `${record.NamespacePrefix}__` : ''}${record.DeveloperName}`;
        return {
          id: value,
          value,
          label: `${record.MasterLabel}${record.NamespacePrefix ? ` (${record.NamespacePrefix})` : ''}`,
          meta: record,
        };
      });
    },
  },
  firstAsDefault: {
    label: 'First is Default',
    type: 'checkbox',
    disabled: (fieldValues: FieldValues) => fieldValues._picklistGlobalValueSet,
  },
  restricted: {
    label: 'Restricted',
    type: 'checkbox',
    disabled: (fieldValues: FieldValues) => fieldValues._picklistGlobalValueSet,
  },
  visibleLines: {
    label: 'Visible Lines',
    type: 'text',
    required: true,
    helpText: (type: SalesforceFieldType) => {
      if (type === 'LongTextArea') {
        return '2 through 50';
      } else if (type === 'Html') {
        return '10 through 50';
      }
    },
    validate: (value: string, type: SalesforceFieldType) => {
      if (!value || !/^[0-9]+$/.test(value)) {
        return false;
      }
      const numValue = Number(value);
      if (type === 'LongTextArea') {
        return isFinite(numValue) && numValue >= 2 && numValue <= 50;
      } else if (type === 'Html') {
        return isFinite(numValue) && numValue >= 10 && numValue <= 50;
      }
      return isFinite(numValue) && numValue >= 0 && numValue <= 10;
    },
  },
  startingNumber: {
    label: 'Starting Number',
    type: 'text',
    validate: (value: string) => {
      if (!value || !/^[0-9]+$/.test(value)) {
        return false;
      }
      const numValue = Number(value);
      return isFinite(numValue) && numValue >= 0;
    },
    required: true,
  },
  displayFormat: {
    label: 'Display Format',
    type: 'text',
    required: true,
  },
  populateExistingRows: {
    label: 'Generate for existing records',
    type: 'checkbox',
  },
  formula: {
    label: 'Formula',
    type: 'textarea',
    required: true,
    // TODO: would be cool to have syntax highlighting
  },
  formulaTreatBlanksAs: {
    label: 'Treat Blanks As',
    type: 'picklist',
    values: [
      { id: 'Blanks', value: 'Blanks', label: 'Blanks' },
      { id: 'BlankAsZero', value: 'BlankAsZero', label: 'Zeros' },
    ],
  },
  secondaryType: {
    label: 'Formula Type',
    type: 'picklist',
    values: [
      { id: 'Checkbox', value: 'Checkbox', label: 'Checkbox' },
      { id: 'Currency', value: 'Currency', label: 'Currency' },
      { id: 'Date', value: 'Date', label: 'Date' },
      { id: 'DateTime', value: 'DateTime', label: 'DateTime' },
      { id: 'Number', value: 'Number', label: 'Number' },
      { id: 'Percent', value: 'Percent', label: 'Percent' },
      { id: 'Text', value: 'Text', label: 'Text' },
      { id: 'Time', value: 'Time', label: 'Time' },
    ],
    required: true,
  },
  writeRequiresMasterRead: {
    label: 'Sharing Settings',
    type: 'picklist',
    values: [
      { id: 'true', value: 'true', label: 'Read Only' },
      { id: 'false', value: 'false', label: 'Read/Write' },
    ],
    labelHelp: 'This determines the default permissions given to child records',
  },
  reparentableMasterDetail: {
    label: 'Allow Reparenting',
    type: 'checkbox',
  },
  relationshipName: {
    label: 'Child Relationship Name',
    type: 'text',
    labelHelp: 'This is relationship name for subqueries.',
    required: true,
    validate: (value: string) => {
      if (!value || !/(^[a-zA-Z]+$)|(^[a-zA-Z]+[0-9a-zA-Z_]*[0-9a-zA-Z]$)/.test(value) || value.includes('__') || value.length > 40) {
        return false;
      }
      return true;
    },
  },
};

export const baseFields: FieldDefinitionType[] = ['type', 'label', 'fullName', 'inlineHelpText', 'description'];
export const allFields: FieldDefinitionType[] = [
  'type',
  'label',
  'fullName',
  'inlineHelpText',
  'description',
  'length',
  'defaultValue',
  'precision',
  'scale',
  'required',
  'unique',
  'externalId',
  'formula',
  'formulaTreatBlanksAs',
  'secondaryType',
  'displayFormat',
  'populateExistingRows',
  'startingNumber',
  'valueSet',
  'globalValueSet',
  'referenceTo',
  'deleteConstraint',
  'writeRequiresMasterRead',
  'reparentableMasterDetail',
  'firstAsDefault',
  'restricted',
  'visibleLines',
  'relationshipName',
];

// The thought here is to know which fields to show when
export const fieldTypeDependencies: FieldValueDependencies = {
  AutoNumber: ['displayFormat', 'startingNumber', 'populateExistingRows'],
  Formula: [
    'formula',
    'formulaTreatBlanksAs', // zeros | blanks
    // Checkbox, Currency, Date, DateTime, Number, Percent, Text, Time
    'secondaryType',
  ],
  Checkbox: [
    'defaultValue', // checked / unchecked
  ],
  Currency: [
    'precision',
    'scale', // AKA decimal places, precision
    'defaultValue',
    'required',
  ],
  Date: ['defaultValue', 'required'],
  DateTime: ['defaultValue', 'required'],
  Time: [
    'defaultValue', // as time values
    'required',
  ],
  Number: [
    'precision',
    'scale', // AKA decimal places, precision
    'defaultValue',
    'required',
    'unique',
    'externalId',
  ],
  Percent: [
    'precision',
    'scale', // AKA decimal places, precision
    'defaultValue',
    'required',
  ],
  Phone: ['defaultValue', 'required'],
  Email: ['defaultValue', 'required', 'unique', 'externalId'],
  MasterDetail: ['referenceTo', 'relationshipName', 'writeRequiresMasterRead', 'reparentableMasterDetail'],
  Lookup: ['referenceTo', 'relationshipName', 'deleteConstraint', 'required'],
  Picklist: ['defaultValue', 'required', 'firstAsDefault', 'restricted'],
  MultiselectPicklist: ['defaultValue', 'required', 'firstAsDefault', 'restricted', 'visibleLines'],
  Url: ['defaultValue', 'required'],
  Text: ['defaultValue', 'length', 'required', 'unique', 'externalId'],
  TextArea: ['required'],
  LongTextArea: ['length', 'visibleLines'],
  Html: ['length', 'visibleLines'],
};

export function getAdditionalFieldDependencies(fieldValues: FieldValues): FieldDefinitionType[] {
  if (fieldValues.type.value === 'Formula' && NUMBER_TYPES.has(fieldValues.secondaryType?.value as SalesforceFieldType)) {
    return ['precision', 'scale'];
  }
  return [];
}

// Some dependencies are missing in normal array but are required for exporting
export const fieldTypeDependenciesExport: FieldValueDependencies = {
  ...fieldTypeDependencies,
  Picklist: [...fieldTypeDependencies.Picklist, 'valueSet', 'globalValueSet'],
  MultiselectPicklist: [...fieldTypeDependencies.MultiselectPicklist, 'valueSet', 'globalValueSet'],
};

export function getInitialValues(key: number): FieldValues {
  return {
    _key: key,
    _allValid: false,
    _picklistGlobalValueSet: true,
    type: {
      value: 'Text',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    label: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    fullName: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    inlineHelpText: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    description: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    defaultValue: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    referenceTo: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    deleteConstraint: {
      value: 'SetNull',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    length: {
      value: '255',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    precision: {
      value: '18',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    scale: {
      value: '0',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    required: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    unique: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    externalId: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    valueSet: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    globalValueSet: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    firstAsDefault: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    restricted: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    visibleLines: {
      value: '3',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    startingNumber: {
      value: '0',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    displayFormat: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    populateExistingRows: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    formula: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    formulaTreatBlanksAs: {
      value: 'Blanks',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    secondaryType: {
      value: 'Text',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    writeRequiresMasterRead: {
      value: 'true',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    reparentableMasterDetail: {
      value: false,
      touched: false,
      isValid: true,
      errorMessage: null,
    },
    relationshipName: {
      value: '',
      touched: false,
      isValid: true,
      errorMessage: null,
    },
  };
}

export function calculateFieldValidity(rows: FieldValues[]): { rows: FieldValues[]; allValid: boolean } {
  let allValid = true;
  const allOutputFieldValues: FieldValues[] = [];
  rows.forEach((fieldValues) => {
    let allRowValid = true;
    const outputFieldValues: FieldValues = { ...fieldValues };
    allOutputFieldValues.push(outputFieldValues);

    // ensure that default value is set correctly based on type of field
    if (fieldValues.type.value === 'Checkbox' && isString(fieldValues.defaultValue.value)) {
      outputFieldValues.defaultValue = {
        ...outputFieldValues.defaultValue,
        value: ensureBoolean(fieldValues.defaultValue.value),
      };
    } else if (fieldValues.type.value !== 'Checkbox' && isBoolean(fieldValues.defaultValue.value)) {
      outputFieldValues.defaultValue = {
        ...outputFieldValues.defaultValue,
        value: '',
      };
    }
    [
      ...baseFields,
      ...fieldTypeDependencies[fieldValues.type.value as FieldDefinitionType],
      ...getAdditionalFieldDependencies(fieldValues),
    ].forEach((fieldName: FieldDefinitionType) => {
      const currField = fieldValues[fieldName];
      if (!currField) {
        return;
      }
      const { isValid, value } = currField;
      const { validate, required } = fieldDefinitions[fieldName];

      if ((isNil(value) || value === '') && required) {
        if (isValid) {
          outputFieldValues[fieldName] = {
            ...currField,
            isValid: false,
            errorMessage: 'This field is required',
          };
        } else {
          outputFieldValues[fieldName] = currField;
        }
      } else if (!isNil(value) && typeof validate === 'function' && !validate(value, fieldValues.type.value as SalesforceFieldType)) {
        if (isValid) {
          outputFieldValues[fieldName] = {
            ...currField,
            isValid: false,
            errorMessage: 'Invalid format',
          };
        } else {
          outputFieldValues[fieldName] = currField;
        }
      } else if (!isValid) {
        outputFieldValues[fieldName] = {
          ...currField,
          isValid: true,
          errorMessage: null,
        };
      } else {
        outputFieldValues[fieldName] = currField;
      }
      if (!outputFieldValues[fieldName].isValid) {
        allRowValid = false;
        allValid = false;
      }
    });

    // Number validation
    if (
      NUMBER_TYPES.has(fieldValues.type.value as SalesforceFieldType) &&
      outputFieldValues.precision.isValid &&
      outputFieldValues.scale.isValid &&
      Number(fieldValues.precision.value) + Number(fieldValues.scale.value) > 18
    ) {
      outputFieldValues.precision = {
        ...outputFieldValues.precision,
        isValid: false,
        touched: true,
        errorMessage: 'The sum of length and decimal places must not exceed 18.',
      };
      outputFieldValues.scale = {
        ...outputFieldValues.scale,
        isValid: false,
        touched: true,
        errorMessage: 'The sum of length and decimal places must not exceed 18.',
      };
      allRowValid = false;
      allValid = false;
    }
    // Picklist validation
    if (fieldValues.type.value === 'Picklist' || fieldValues.type.value === 'MultiselectPicklist') {
      const isValid = validatePicklist(fieldValues, outputFieldValues);
      if (!isValid) {
        allRowValid = false;
        allValid = false;
      }
    }
    outputFieldValues._allValid = allRowValid;
  });
  return { rows: allOutputFieldValues, allValid };
}

export function generateApiNameFromLabel(value: string) {
  let fullNameValue = value;
  if (fullNameValue) {
    fullNameValue = fullNameValue
      .replace(REGEX.NOT_ALPHANUMERIC_OR_UNDERSCORE, '_')
      .replace(REGEX.STARTS_WITH_UNDERSCORE, '')
      .replace(REGEX.CONSECUTIVE_UNDERSCORES, '_')
      .replace(REGEX.ENDS_WITH_NON_ALPHANUMERIC, '');
    if (REGEX.STARTS_WITH_NUMBER.test(fullNameValue)) {
      fullNameValue = `X${fullNameValue}`;
    }
    if (fullNameValue.length > 40) {
      fullNameValue = fullNameValue.substring(0, 40);
    }
  }
  return fullNameValue;
}

/**
 * Picklists have dependencies on either global or standard picklists
 * so this is an edge case handled separately
 *
 * @param fieldValues
 * @param outputFieldValues
 * @returns
 */
function validatePicklist(fieldValues: FieldValues, outputFieldValues: FieldValues): boolean {
  let allValid = true;
  if (fieldValues._picklistGlobalValueSet) {
    const isValid = !!fieldValues.globalValueSet.value;
    outputFieldValues.globalValueSet = {
      ...fieldValues.globalValueSet,
      isValid,
      errorMessage: isValid ? null : 'This field is required',
    };
    outputFieldValues.valueSet = {
      ...fieldValues.valueSet,
      value: '',
      isValid: true,
      errorMessage: null,
    };
    allValid = isValid;
  } else {
    const isValid = !!fieldValues.valueSet.value;
    outputFieldValues.globalValueSet = {
      ...fieldValues.globalValueSet,
      isValid: true,
      errorMessage: null,
    };
    outputFieldValues.valueSet = {
      ...fieldValues.valueSet,
      isValid,
      errorMessage: isValid ? null : 'This field is required',
    };
    allValid = isValid;
  }
  return allValid;
}

export function preparePayload(sobjects: string[], rows: FieldValues[]): FieldDefinitionMetadata[] {
  return rows.flatMap((row) => sobjects.map((sobject) => prepareFieldPayload(sobject, row)));
}

function prepareFieldPayload(sobject: string, fieldValues: FieldValues): FieldDefinitionMetadata {
  const fieldMetadata: FieldDefinitionMetadata = [
    ...baseFields,
    ...fieldTypeDependencies[fieldValues.type.value as FieldDefinitionType],
    ...getAdditionalFieldDependencies(fieldValues),
  ].reduce((output: FieldDefinitionMetadata, field: FieldDefinitionType) => {
    if (!isNil(fieldValues[field].value) && fieldValues[field].value !== '') {
      output[field] = fieldValues[field].value;
    }
    return output;
  }, {});
  // prefix with object
  fieldMetadata.fullName = `${sobject}.${fieldMetadata.fullName}__c`;

  if (fieldValues.type.value === 'Formula') {
    fieldMetadata.type = fieldValues.secondaryType.value;
    fieldMetadata.secondaryType = undefined;

    if (fieldValues.formulaTreatBlanksAs.value === 'Blanks') {
      fieldMetadata.formulaTreatBlanksAs = undefined;
    }
  }

  if (fieldValues.type.value === 'Checkbox') {
    fieldMetadata.defaultValue = fieldMetadata.defaultValue ?? false;
  }

  if (fieldValues.type.value === 'Picklist' || fieldValues.type.value === 'MultiselectPicklist') {
    // restricted, firstAsDefault, sorted, data structure for valueSet (if exists)
    fieldMetadata.restricted = undefined;
    fieldMetadata.firstAsDefault = undefined;
    // fieldMetadata.sorted = undefined; // TODO: do we need to set this one?
    if (fieldValues._picklistGlobalValueSet) {
      fieldMetadata.valueSet = {
        valueSetName: fieldValues.globalValueSet.value,
      };
    } else {
      fieldMetadata.valueSet = {
        restricted: fieldValues.restricted.value,
        valueSetDefinition: {
          sorted: false,
          // sorted: fieldValues.sorted.value,
          value: (fieldValues.valueSet.value as string).split('\n').map((value, i) => ({
            fullName: value,
            label: value,
            default: fieldValues.firstAsDefault.value && i === 0,
          })),
        },
      };
    }
  }

  return fieldMetadata;
}

export function getFieldPermissionRecords(fullName: string, type: SalesforceFieldType, profiles: string[], permissionSets: string[]) {
  const [SobjectType] = fullName.split('.');
  return [...profiles, ...permissionSets].map((ParentId) => ({
    attributes: {
      type: 'FieldPermissions',
    },
    Field: fullName,
    ParentId,
    PermissionsEdit: READ_ONLY_TYPES.has(type) ? false : true,
    PermissionsRead: true,
    SobjectType,
  }));
}

export function addFieldToLayout(fields: FieldDefinitionMetadata[], layout: LayoutRecord): boolean {
  // need to see if field should be readonly on the layout
  const fieldsByApiName = fields.reduce((output, field) => {
    const fieldApiName = field.fullName.split('.')[1];
    if (fieldApiName && !output[fieldApiName]) {
      output[fieldApiName] = field;
    }
    return output;
  }, {});

  const layoutSectionsJson = JSON.stringify(layout.Metadata.layoutSections);
  // ensure field does not already exist on layout
  const fieldsToAdd = Object.keys(fieldsByApiName).filter((field) => !layoutSectionsJson.includes(`"field":"${field}"`));
  fieldsToAdd.forEach((field) => {
    let behavior: 'Edit' | 'Readonly' | 'Required' = 'Edit';
    if (READ_ONLY_TYPES.has(fieldsByApiName[field].type) || fieldsByApiName[field].formula) {
      behavior = 'Readonly';
    } else if (fieldsByApiName[field].required) {
      behavior = 'Required';
    }
    layout.Metadata.layoutSections[0].layoutColumns[0].layoutItems.push({
      field,
      behavior,
      analyticsCloudComponent: null,
      canvas: null,
      component: null,
      customLink: null,
      emptySpace: null,
      height: null,
      page: null,
      reportChartComponent: null,
      scontrol: null,
      showLabel: null,
      showScrollbars: null,
      width: null,
    });
    // Random SFDC error for this ENUM
    // Cannot deserialize instance of complexvalue from VALUE_STRING value DEFAULT or request may be missing a required field at [line:843, column:31]
    if (isString(layout.Metadata?.summaryLayout?.summaryLayoutStyle)) {
      layout.Metadata.summaryLayout = undefined;
    }
  });
  return fieldsToAdd.length > 0;
}

export async function deployLayouts(
  apiVersion: string,
  selectedOrg: SalesforceOrgUi,
  layoutIds: string[],
  fields: FieldDefinitionMetadata[]
) {
  /** FETCH LAYOUTS */
  const layoutsWithFullMetadata = splitArrayToMaxSize(Object.values(layoutIds), 25).map((_layoutIds) => ({
    allOrNone: false,
    compositeRequest: _layoutIds.map((layoutId) => ({
      method: 'GET',
      url: `/services/data/${apiVersion}/tooling/sobjects/Layout/${layoutId}?fields=Id,FullName,Metadata`,
      referenceId: layoutId,
    })),
  }));

  const layoutsToUpdate: LayoutRecord[] = [];
  const updatedLayoutIds: string[] = [];
  const errors: string[] = [];

  for (const compositeRequest of layoutsWithFullMetadata) {
    const response = await genericRequest<CompositeResponse<LayoutRecord | { errorCode: string; message: string }[]>>(selectedOrg, {
      isTooling: true,
      method: 'POST',
      url: `/services/data/${apiVersion}/tooling/composite`,
      body: compositeRequest,
    });

    response.compositeResponse.forEach(({ body, httpStatusCode, referenceId }) => {
      if (httpStatusCode < 200 || httpStatusCode > 299) {
        if (Array.isArray(body)) {
          // ERROR getting full layout metadata
          if (Array.isArray(body)) {
            errors.push(body.map(({ message }) => message).join(' '));
          }
        }
      } else {
        const didAddFields = addFieldToLayout(fields, body as LayoutRecord);
        if (didAddFields) {
          layoutsToUpdate.push(body as LayoutRecord);
        }
      }
    });
  }

  /** UPDATE LAYOUTS */
  const layoutsToUpdateWithFullMetadata = splitArrayToMaxSize(layoutsToUpdate, 25).map((_layoutsToUpdate) => ({
    allOrNone: false,
    compositeRequest: _layoutsToUpdate.map((layout) => ({
      method: 'PATCH',
      url: `/services/data/${apiVersion}/tooling/sobjects/Layout/${layout.Id}`,
      referenceId: layout.Id,
      body: { ...layout, Id: null },
    })),
  }));

  for (const compositeRequest of layoutsToUpdateWithFullMetadata) {
    const response = await genericRequest<CompositeResponse<null | { errorCode: string; message: string }[]>>(selectedOrg, {
      isTooling: true,
      method: 'POST',
      url: `/services/data/${apiVersion}/tooling/composite`,
      body: compositeRequest,
    });
    response.compositeResponse.forEach(({ body, httpStatusCode, referenceId }) => {
      if (httpStatusCode < 200 || httpStatusCode > 299) {
        if (Array.isArray(body)) {
          errors.push(body.map(({ message }) => message).join(' '));
        }
      } else {
        updatedLayoutIds.push(referenceId);
      }
    });
  }

  return {
    updatedLayoutIds,
    errors,
  };
}

export function getRowsForExport(fieldValues: FieldValues[]) {
  const BASE_FIELDS = new Set(baseFields);
  return fieldValues.map((row) =>
    allFields.reduce((output, field) => {
      if (BASE_FIELDS.has(field) || fieldTypeDependenciesExport[row.type.value as SalesforceFieldType].includes(field)) {
        if (field === 'globalValueSet' && row._picklistGlobalValueSet) {
          output[field] = row[field].value;
        } else if (field === 'valueSet' && !row._picklistGlobalValueSet) {
          output[field] = row[field].value;
        } else if (field !== 'globalValueSet' && field !== 'valueSet') {
          output[field] = row[field].value;
        }
      }
      return output;
    }, {})
  );
}

export function prepareDownloadResultsFile(fieldResults: CreateFieldsResults[], fieldValues: FieldValues[]) {
  let permissionRecords = [];
  const resultsWorksheet = fieldResults.map(
    ({ label, state, deployResult, flsResult, flsErrors, flsRecords, layoutErrors, updatedLayoutIds }) => {
      permissionRecords = permissionRecords.concat(flsRecords);
      let _flsResult = 'N/A';
      if (flsResult && flsResult.length) {
        _flsResult = flsResult?.every?.((result) => result.success) ? 'SUCCESS' : 'PARTIAL SUCCESS';
      }
      return {
        Field: label,
        'Field Status': state,
        'Field Id': isString(deployResult) ? deployResult : '',
        'FLS Result': _flsResult,
        'FLS Errors': flsErrors?.join?.('\n') || '',
        'Page Layouts Updated': updatedLayoutIds?.join('\n') || '',
        'Page Layouts Errors': layoutErrors?.join('\n') || '',
      };
    }
  );
  return {
    worksheetData: {
      Results: resultsWorksheet,
      'Import Template': getRowsForExport(fieldValues),
      'Permission Records': permissionRecords.filter(Boolean) || [],
    },
    headerData: {
      Results: ['Field', 'Field Status', 'Field Id', 'FLS Result', 'FLS Errors', 'Page Layouts Updated', 'Page Layouts Errors'],
      'Import Template': allFields,
      'Permission Records': ['Success', 'Id', 'Errors', 'SobjectType', 'Field', 'ParentId', 'PermissionsEdit', 'PermissionsRead'],
    },
  };
}