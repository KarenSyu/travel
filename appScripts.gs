// 設定時區，確保寫入 Google Sheet 的時間是正確的 (例如台灣 GMT+8)
const TIMEZONE = "GMT+8";

function doGet(e) { 
  console.log("doGet:", e);
  var sheetName = e.parameter ? e.parameter.sheetName : null;

  // 修正 1: 確保每個 case 都有 return
  switch (sheetName){
    case "ACCOUNTING":
      return getAccounting(); // 需新增此函式
    default :
      return getItinerary();
  }
}

function doPost(e) {
  console.log("doPost:", e);
  
  // 增加錯誤處理，防止 JSON 解析失敗導致崩潰
  try {
    const postData = JSON.parse(e.postData.contents);
    
    // 修正 2: 這裡必須使用 return 將結果傳回給前端
    switch (postData.sheetName){
      case "ACCOUNTING":
        return postAccounting(postData);
      default :
        return postItinerary(postData);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'JSON Parse Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =======================
// 行程相關 (Itinerary)
// =======================

function getItinerary(){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("行程");
  // 防呆：如果工作表不存在
  if (!sheet) {
    return createJSONOutput([]); 
  }

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return createJSONOutput([]);

  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // 轉成字串避免前端型別問題，或保持原樣
      obj[header] = row[index];
    });
    return obj;
  });

  return createJSONOutput(result);
}

function postItinerary(postData){
  // 這裡補上寫入邏輯，策略：全刪全寫 (最簡單同步方式)
  var lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('行程');
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('行程');
      }

      // 解析前端傳來的平坦化陣列
      // 假設前端傳來的資料結構是直接的 Array，或是包在某個 key 裡
      // 根據你之前的 code，這裡假設 postData 本身就是 Array 或是 postData.data
      var newRowsData = Array.isArray(postData) ? postData : (postData.data || []); 
      
      if (newRowsData.length === 0) {
         return createJSONOutput({ status: 'success', message: 'No data to write' });
      }

      // 取得標題 (這一步看你要固定標題還是動態，這裡假設依照第一筆資料的 key 當標題)
      // 建議：最好是固定標題順序
      const headers = ['dayNumber', 'date', 'dayTitle', 'time', 'activityTitle', 'description', 'location', 'icon', 'transportSuggestion'];
      
      // 準備寫入的二維陣列
      var outputValues = newRowsData.map(row => {
        return headers.map(header => row[header] || '');
      });

      // 寫入 Google Sheet
      sheet.clear(); // 清空舊資料
      sheet.appendRow(headers); // 寫入標題
      if (outputValues.length > 0) {
        sheet.getRange(2, 1, outputValues.length, headers.length).setValues(outputValues);
      }

      return createJSONOutput({ status: 'success', message: 'Itinerary updated' });

    } catch (e) {
      return createJSONOutput({ status: 'error', message: e.toString() });
    } finally {
      lock.releaseLock();
    }
  }
  return createJSONOutput({ status: 'error', message: 'Server busy' });
}

// =======================
// 記帳相關 (Accounting)
// =======================

function getAccounting() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('記帳');
  if (!sheet) return createJSONOutput([]);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createJSONOutput([]);

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var expenses = data.map(function(row) {
    return {
      id: String(row[0]),
      date: new Date(row[1]).getTime(), // 回傳 timestamp 給前端比較好處理
      item: row[2],
      amount: Number(row[3]),
      category: row[4],
      note: row[5]
    };
  });

  return createJSONOutput(expenses);
}

function postAccounting(postData){
  var lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('記帳');
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('記帳');
        sheet.appendRow(['ID', '日期', '品項', '金額(JPY)', '類別', '備註', '更新時間']);
      }

      // 1. 讀取現有資料
      var existingData = {};
      var lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
        for (var i = 0; i < values.length; i++) {
          var row = values[i];
          var id = String(row[0]);
          if (id) {
             var dateVal = row[1];
             var timestamp = (dateVal instanceof Date) ? dateVal.getTime() : new Date(dateVal).getTime();
             existingData[id] = {
               id: id,
               date: timestamp,
               item: row[2],
               amount: Number(row[3]),
               category: row[4],
               note: row[5] || ''
             };
          }
        }
      }

      // 2. 合併 App 傳來的資料
      var clientExpenses = postData.expenses || [];
      for (var j = 0; j < clientExpenses.length; j++) {
        var exp = clientExpenses[j];
        // 前端傳來的可能是 ISO 字串或 timestamp，統一轉 timestamp
        var expDate = new Date(exp.date).getTime();
        existingData[exp.id] = {
          ...exp,
          date: expDate
        };
      }

      // 3. 轉回陣列並排序
      var mergedList = Object.keys(existingData).map(function(key) {
        return existingData[key];
      });
      mergedList.sort(function(a, b) {
        return b.date - a.date;
      });

      // 4. 寫回 Google Sheet
      // 清空舊內容 (保留標題)
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
      }

      if (mergedList.length > 0) {
        var outputRows = mergedList.map(function(item) {
          // 修正日期格式：使用 Utilities.formatDate 指定時區，避免伺服器時區問題
          var dateStr = Utilities.formatDate(new Date(item.date), TIMEZONE, "yyyy/MM/dd");
          var updateTimeStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy/MM/dd HH:mm:ss");
          
          return [
            item.id,
            dateStr, // 使用格式化後的日期字串
            item.item,
            item.amount,
            item.category,
            item.note || '',
            updateTimeStr
          ];
        });
        
        sheet.getRange(2, 1, outputRows.length, 7).setValues(outputRows);
      }

      return createJSONOutput({
        status: 'success',
        expenses: mergedList
      });

    } catch (error) {
      return createJSONOutput({ status: 'error', message: error.toString() });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJSONOutput({ status: 'error', message: 'Server busy' });
  }
}

// 輔助函式：統一回傳 JSON 格式
function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}