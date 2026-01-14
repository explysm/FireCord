import { byDisplayName, byFilePath, byName, byProps, byStoreName, byTypeName } from "./filters";
import { findAllExports, findExports } from "./finders";
import { createLazyModule } from "./lazy";

export const findByProps = <T = any>(...props: string[]) => findExports<T>(byProps(...props));
export const findByPropsLazy = <T = any>(...props: string[]) => createLazyModule<any>(byProps(...props)) as T;
export const findByPropsAll = <T = any>(...props: string[]) => findAllExports<T>(byProps(...props));

export const findByName = <T = any>(name: string, expDefault = true) => findExports<T>(expDefault ? byName(name) : byName.byRaw(name));
export const findByNameLazy = <T = any>(name: string, expDefault = true) => createLazyModule<any>(expDefault ? byName(name) : byName.byRaw(name)) as T;
export const findByNameAll = <T = any>(name: string, expDefault = true) => findAllExports<T>(expDefault ? byName(name) : byName.byRaw(name));

export const findByDisplayName = <T = any>(name: string, expDefault = true) => findExports<T>(expDefault ? byDisplayName(name) : byDisplayName.byRaw(name));
export const findByDisplayNameLazy = <T = any>(name: string, expDefault = true) => createLazyModule<any>(expDefault ? byDisplayName(name) : byDisplayName.byRaw(name)) as T;
export const findByDisplayNameAll = <T = any>(name: string, expDefault = true) => findAllExports<T>(expDefault ? byDisplayName(name) : byDisplayName.byRaw(name));

export const findByTypeName = <T = any>(name: string, expDefault = true) => findExports<T>(expDefault ? byTypeName(name) : byTypeName.byRaw(name));
export const findByTypeNameLazy = <T = any>(name: string, expDefault = true) => createLazyModule<any>(expDefault ? byTypeName(name) : byTypeName.byRaw(name)) as T;
export const findByTypeNameAll = <T = any>(name: string, expDefault = true) => findAllExports<T>(expDefault ? byTypeName(name) : byTypeName.byRaw(name));

export const findByStoreName = <T = any>(name: string) => findExports<T>(byStoreName(name));
export const findByStoreNameLazy = <T = any>(name: string) => createLazyModule<any>(byStoreName(name)) as T;

export const findByFilePath = <T = any>(path: string, expDefault = false) => findExports<T>(byFilePath(path, expDefault));
export const findByFilePathLazy = <T = any>(path: string, expDefault = false) => createLazyModule<any>(byFilePath(path, expDefault)) as T;
