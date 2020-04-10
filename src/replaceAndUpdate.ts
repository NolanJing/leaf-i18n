/**
 * @author linhuiw
 * @desc 更新文件
 */

import { TargetStr } from './define';
import * as vscode from 'vscode';
import { updateVueLangFiles } from './file';
import { COMMON, I18N_GLOB_PATH } from './const';

export function replaceAndUpdateInVue(
  targetStr: TargetStr,
  keyName: string,
  isExsit: boolean
) {
  let isCommon = keyName.startsWith(`[${COMMON}]`);
  if (isCommon) {
    keyName = keyName.replace(`[${COMMON}]->`, '');
  }
  const edit = new vscode.WorkspaceEdit();
  const { document } = vscode.window.activeTextEditor;
  let finalReplaceVal = `$t('${keyName}')`;
  let start = targetStr.range.start.translate(0, -1);
  let end = targetStr.range.end.translate(0, 1);
  // vue的script中需要加 i18n.t 开头
  if (targetStr.isVueJsx) {
    finalReplaceVal = `i18n.t('${keyName}')`;
  }
  // vue Template中的需要加 {{ }}
  if (targetStr.isTemplatePureString) {
    start = targetStr.range.start;
    end = targetStr.range.end;
    finalReplaceVal = `{{$t('${keyName}')}}`;
  }
  // vue的template中的属性
  // 两种情况
  if (targetStr.isVueAttr) {
    if (!targetStr.attr.name.includes(':')) {
      finalReplaceVal = `:${targetStr.attr.name}="$t('${keyName}')"`;
      start = targetStr.attr.range.start;
      end = targetStr.attr.range.end;
    }
  }

  if (targetStr.isVueDirective) {
    // todo
  }
  edit.replace(
    document.uri,
    targetStr.range.with({
      start: start,
      end: end
    }),
    finalReplaceVal
  );
  // 将[${COMMON}]-> 加回来，方便插入文件时判定 
  if (isCommon) {
    keyName = `[${COMMON}]->` + keyName;
  }
  try {
    // 更新语言文件
    if (!isExsit) {
      // 如果原先的文件中已经有键值了就不需要再更新了
      updateVueLangFiles(keyName, targetStr.text);
    }
    // 若更新成功再替换代码
    return vscode.workspace.applyEdit(edit);
  } catch (err) {
    console.log(err);
  }
}
