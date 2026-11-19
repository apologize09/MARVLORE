function t(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function o(e,i={}){if(!e)return null;let r=t(i.title&&String(i.title).trim()||"Creative Work"),n=String(i.intro||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),a=t(n||"\u4ECE\u54C1\u724C\u89C6\u89C9\u5230\u52A8\u6001\u5F71\u50CF\u4E0E\u6570\u5B57\u4F53\u9A8C\uFF0C\u6D4F\u89C8\u5168\u90E8\u5DF2\u53D1\u5E03\u4F5C\u54C1\u3002"),l=i.mode==="detail-placeholder"?"detail-placeholder":"list",s=i.slug?t(i.slug):"",c=l==="detail-placeholder"?`<div class="work-listing-placeholder" data-work-listing-body>
          <p>\u4F5C\u54C1\u8BE6\u60C5\u8DEF\u7531\u5DF2\u5C31\u7EEA\u3002</p>
          <p class="work-listing-slug">/${s}</p>
          <p class="work-listing-note">\u5B8C\u6574\u8BE6\u60C5\u89C6\u56FE\u5C06\u5728\u4E0B\u4E00\u9636\u6BB5\u63A5\u5165\u3002</p>
        </div>`:`<div class="work-listing-placeholder" data-work-listing-body>
          <p>\u4F5C\u54C1\u603B\u89C8\u5373\u5C06\u5448\u73B0\u5168\u90E8\u6848\u4F8B\u3001\u5206\u7C7B\u4E0E\u641C\u7D22\u3002</p>
          <p class="work-listing-note">\u6B64\u4E3A\u8DEF\u7531\u58F3 \u2014 \u5361\u7247\u7F51\u683C\u4E0E\u7B5B\u9009\u5C06\u5728\u4E0B\u4E00\u9636\u6BB5\u63A5\u5165\u3002</p>
        </div>`;return e.innerHTML=`<section class="work-listing screen wrap" data-work-listing aria-labelledby="work-listing-title">
    <header class="work-listing-header">
      <a class="work-listing-back" href="/" data-work-listing-back>
        <span aria-hidden="true">\u2190</span> \u8FD4\u56DE\u9996\u9875
      </a>
      <h1 id="work-listing-title">${r}</h1>
      <p class="work-listing-intro">${a}</p>
    </header>
    ${c}
  </section>`,e.hidden=!1,e.setAttribute("data-work-channel",l),e}function d(e={}){if(typeof document>"u")return;let i=e.seoTitle&&String(e.seoTitle).trim()||e.title&&String(e.title).trim()||"Creative Work";document.title=/marvlore/i.test(i)?i:`${i} \xB7 MARVLORE`}function g(e){e&&(e.hidden=!0,e.removeAttribute("data-work-channel"),e.innerHTML="")}export{d as applyWorkListingSeo,g as hideWorkListingShell,o as renderWorkListingShell};
