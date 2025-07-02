/**
 * This file contains the base AssertionContext which can be extended
 * by your library if you want.
 *
 * Copyright 2025 Adligo Inc / Scott Morgan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
    ComparisionNodeType, ComparisonNodeInfoType, TypeName, toTypeNameLabel
} from '@ts.adligo.org/i_tests4ts_types/dist/i_tests4ts_types.mjs';
import {
    I_ComparisionNode, I_ComparisionArrayInfo, I_ComparisionBaseInfo, I_ComparisionEqualInfo,
    I_ComparisionCollectionSizeInfo, I_ComparisionMapValueInfo, I_ComparisionSetInfo, I_ComparisionTypeInfo, I_RecursiveEqualsResult, I_RecursiveEqualsResultErrorFormmater
} from '@ts.adligo.org/i_tests4ts/dist/i_tests4ts.mjs';

import { Errors, isNil, Objs, Maps, Sets, Strings } from "@ts.adligo.org/type-guards/dist/typeGuards.mjs";
import { I_Equatable } from '@ts.adligo.org/i_obj/dist/i_obj.mjs';
import { I_String } from '@ts.adligo.org/i_strings/dist/i_strings.mjs';

export class RecursiveEqualsResultErrorFormmater implements I_RecursiveEqualsResultErrorFormmater {
    _tab: string = "  ";

    format(result: I_RecursiveEqualsResult, message?: string): string {
        let cn: I_ComparisionNode = result.getComparisionNode() as I_ComparisionNode;

        var r = isNil(message) ? '\n' : '\n' + message + '\n';

        r += "Equals expected;\n" +
            this._tab +"'" + this.toString(cn.getExpected()) + "'\n" +
            "Actual;\n" +
            this._tab + "'" + this.toString(cn.getActual()) + "'\n";
        var tab = this._tab;
        for (var i: number = 0; i < cn.getChildInfoSize(); i++) {
            r += this.equalsFormatDeepNotEqualsHelper(cn.getChildInfo(i), i, tab);
            tab += this._tab;
        }
        return r;
    }

    equalsFormatDeepNotEqualsHelper(result: I_ComparisionBaseInfo,  counter: number, tabIndent: string): string {
        let type: ComparisonNodeInfoType = result.getInfoType();
        switch (type) {
            case ComparisonNodeInfoType.Array:
                let ra: I_ComparisionArrayInfo = result as I_ComparisionArrayInfo;
                return tabIndent + "#" + counter + " Array @ idx " + ra.getIndex() + "\n";
            case ComparisonNodeInfoType.CollectionSize:
                let cs: I_ComparisionCollectionSizeInfo = result as I_ComparisionCollectionSizeInfo;
                return tabIndent + "#" + counter + " CollectionSize expected " + cs.getExpectedSize() + " actual " + cs.getActualSize() + "\n";
            case ComparisonNodeInfoType.Equal:
                let eq: I_ComparisionEqualInfo = result as I_ComparisionEqualInfo;
                return tabIndent + "#" + counter + " Equals expected;\n" +
                    tabIndent + this._tab + "'" + this.toString(eq.getExpected()) + "'\n" +
                    tabIndent + "Actual;\n" +
                    tabIndent + this._tab + "'" + this.toString(eq.getActual()) + "'\n";
            case ComparisonNodeInfoType.MapValue:
                let mv: I_ComparisionMapValueInfo = result as I_ComparisionMapValueInfo;
                return tabIndent + "#" + counter + " MapValue key;\n" +
                    tabIndent + this._tab + "'" + this.toString(mv.getKey()) + "'\n" +
                    tabIndent + "Expected;\n" +
                    tabIndent + this._tab + "'" + this.toString(mv.getExpectedValue()) + "'\n" +
                    tabIndent + "Actual;\n" +
                    tabIndent + this._tab + "'" + this.toString(mv.getActualValue()) + "'\n";
            case ComparisonNodeInfoType.Set:
                return tabIndent + "#" + counter + " Set is NOT yet suppored. \n";
            case ComparisonNodeInfoType.Type:
                let ti: I_ComparisionTypeInfo = result as I_ComparisionTypeInfo;
                return tabIndent + "#" + counter + " TypeEquals expected;\n" +
                    tabIndent + this._tab + toTypeNameLabel(ti.getExpectedType()) + "\n" +
                    tabIndent + "Actual;\n" +
                    tabIndent + this._tab + toTypeNameLabel(ti.getActualType()) + "\n";
        }
    }


    toString(obj: I_String | string | any): string {
        if (obj == undefined) {
            return obj;
        }
        if (Strings.isI_String(obj)) {
            return (obj as I_String).toString();
        }
        if (typeof obj === 'string') {
            return obj;
        }
        if (Maps.isMap(obj)) {
            return JSON.stringify(Object.fromEntries(obj));
        }
        if (typeof obj === 'object') {
            return JSON.stringify(obj);
        }
        //implicit toString conversion, but will likely turn into '[Object]'
        return '' + obj;
    }
}