import { MapOf } from '@silverthorn/api-interfaces';
import { DescribeGlobalSObjectResult } from 'jsforce';
import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { FieldWrapper, QueryFields } from '../../types/types';
import SobjectFieldList from '../shared/SobjectFieldList/SobjectFieldList';
import { fetchFields } from './query-utils';
import { sortQueryFieldsStr } from '../../utils/utils';
import AutoFullHeightContainer from '../core/AutoFullHeightContainer';

export interface QueryFieldsProps {
  activeSObject: DescribeGlobalSObjectResult;
  onSelectionChanged: (fields: string[]) => void;
  onFieldsFetched: (queryFields: MapOf<QueryFields>) => void;
}

export const QueryFieldsComponent: FunctionComponent<QueryFieldsProps> = ({ activeSObject, onSelectionChanged, onFieldsFetched }) => {
  const [queryFieldsMap, setQueryFieldsMap] = useState<MapOf<QueryFields>>({});
  const [baseKey, setBaseKey] = useState<string>(null);

  // Fetch fields for base object if the selected object changes
  useEffect(() => {
    // init query fields when object changes
    const tempQueryFieldsMap: MapOf<QueryFields> = {};
    setQueryFieldsMap(tempQueryFieldsMap);
    if (activeSObject) {
      const BASE_KEY = `${activeSObject.name}|`;
      setBaseKey(BASE_KEY);
      tempQueryFieldsMap[BASE_KEY] = {
        key: BASE_KEY,
        expanded: true,
        loading: true,
        filterTerm: '',
        sobject: activeSObject.name,
        fields: {},
        visibleFields: new Set(),
        selectedFields: new Set(),
      };
      (async () => {
        const clonedData = { ...tempQueryFieldsMap };
        clonedData[BASE_KEY] = await fetchFields(tempQueryFieldsMap[BASE_KEY]);
        clonedData[BASE_KEY] = { ...clonedData[BASE_KEY], loading: false };
        setQueryFieldsMap(clonedData);
        onFieldsFetched(clonedData);
      })();
    }
    setQueryFieldsMap(tempQueryFieldsMap);
  }, [activeSObject, onFieldsFetched]);

  function emitSelectedFieldsChanged(fieldsMap: MapOf<QueryFields> = queryFieldsMap) {
    const fields = Object.values(fieldsMap).flatMap((queryField) => {
      const basePath = queryField.key.replace(/.+\|/, '');
      return sortQueryFieldsStr(Array.from(queryField.selectedFields)).map((fieldKey) => `${basePath}${fieldKey}`);
    });
    onSelectionChanged(fields);
  }

  async function handleToggleFieldExpand(parentKey: string, field: FieldWrapper) {
    // FIXME: should be centralized:
    const key = `${parentKey}${field.metadata.relationshipName}.`;
    // if field is already initialized
    const clonedQueryFieldsMap = { ...queryFieldsMap };
    if (clonedQueryFieldsMap[key]) {
      clonedQueryFieldsMap[key] = { ...clonedQueryFieldsMap[key], expanded: !clonedQueryFieldsMap[key].expanded };
    } else {
      // this is a new expansion that we have not seen, we need to fetch the fields and init the object
      clonedQueryFieldsMap[key] = {
        key,
        expanded: true,
        loading: true,
        filterTerm: '',
        sobject: field.relatedSobject as string,
        fields: {},
        visibleFields: new Set(),
        selectedFields: new Set(),
      };
      // fetch fields and update once resolved
      (async () => {
        // TODO: what if object selection changed? may need to ensure key still exists
        clonedQueryFieldsMap[key] = await fetchFields(clonedQueryFieldsMap[key]);
        clonedQueryFieldsMap[key] = { ...clonedQueryFieldsMap[key], loading: false };
        setQueryFieldsMap({ ...clonedQueryFieldsMap });
        onFieldsFetched(clonedQueryFieldsMap);
      })();
    }
    setQueryFieldsMap(clonedQueryFieldsMap);
  }

  function handleFieldSelection(key: string, field: FieldWrapper) {
    if (queryFieldsMap[key]) {
      // TODO: do we need a new instance of the set - this is really expensive in child component effects?
      // const clonedQueryFieldsMap = { ...queryFieldsMap };
      const clonedFieldsMapItem = { ...queryFieldsMap[key] };
      if (clonedFieldsMapItem.selectedFields.has(field.name)) {
        clonedFieldsMapItem.selectedFields.delete(field.name);
      } else {
        clonedFieldsMapItem.selectedFields.add(field.name);
      }
      queryFieldsMap[key] = { ...clonedFieldsMapItem };
      setQueryFieldsMap(queryFieldsMap);
      emitSelectedFieldsChanged(queryFieldsMap);
    }
  }

  function handleFieldSelectAll(key: string, value: boolean) {
    if (queryFieldsMap[key]) {
      const clonedQueryFieldsMap = { ...queryFieldsMap };
      if (value) {
        clonedQueryFieldsMap[key] = { ...clonedQueryFieldsMap[key], selectedFields: new Set(clonedQueryFieldsMap[key].visibleFields) };
      } else {
        // remove visible fields from list (this could be all or only some of the fields)
        const selectedFields = new Set(clonedQueryFieldsMap[key].selectedFields);
        clonedQueryFieldsMap[key].visibleFields.forEach((field) => selectedFields.delete(field));
        clonedQueryFieldsMap[key] = { ...clonedQueryFieldsMap[key], selectedFields };
      }
      setQueryFieldsMap(clonedQueryFieldsMap);
      emitSelectedFieldsChanged(clonedQueryFieldsMap);
    }
  }

  function handleFieldFilterChanged(key: string, filterTerm: string) {
    if (queryFieldsMap[key] && queryFieldsMap[key].filterTerm !== filterTerm) {
      const clonedQueryFieldsMap = { ...queryFieldsMap };
      const tempQueryField = { ...clonedQueryFieldsMap[key], filterTerm: filterTerm || '' };
      filterTerm = (filterTerm || '').toLocaleLowerCase();
      if (!filterTerm) {
        tempQueryField.visibleFields = new Set(Object.keys(tempQueryField.fields));
      } else {
        tempQueryField.visibleFields = new Set(
          Object.values(tempQueryField.fields)
            .filter((field) => field.filterText.includes(filterTerm))
            .map((field) => field.name)
        );
      }
      clonedQueryFieldsMap[key] = tempQueryField;
      setQueryFieldsMap(clonedQueryFieldsMap);
    }
  }

  return (
    <Fragment>
      {activeSObject && queryFieldsMap[baseKey] && (
        <AutoFullHeightContainer>
          <SobjectFieldList
            level={0}
            itemKey={baseKey}
            queryFieldsMap={queryFieldsMap}
            sobject={activeSObject.name}
            onToggleExpand={handleToggleFieldExpand}
            onSelectField={handleFieldSelection}
            onSelectAll={handleFieldSelectAll}
            onFilterChanged={handleFieldFilterChanged}
          />
        </AutoFullHeightContainer>
      )}
    </Fragment>
  );
};

export default QueryFieldsComponent;