var t=(a,c)=>`<span class="contact-label-main" aria-hidden="true">${a}<small>${c}</small></span><span class="contact-label-emphasis" aria-hidden="true"><i></i><span>${a}</span></span><span class="sr-only">${a} \xB7 ${c}</span>`,n=a=>`<span class="contact-value-main">${a}</span><span class="contact-value-large" aria-hidden="true"><span>${a}</span></span>`;function o(){return`
<footer id="contact" class="contact contact-colophon screen" data-screen="08-contact" aria-labelledby="contact-title">
 <div class="contact-columns">
  <div class="contact-location">
   <h2 id="contact-title" data-contact-enter><span data-contact-motion>Get In Touch</span></h2>
   <p class="contact-welcome" data-contact-enter><span data-contact-motion>\u6B22\u8FCE\u8054\u7EDC</span></p>
   <p class="contact-address" data-contact-enter><span data-contact-motion>Shenzhen,<br>China</span><span class="contact-address-cn" data-contact-motion>\u4E2D\u56FD\u6DF1\u5733</span></p>
   <p class="contact-studio-note" data-contact-enter><span data-contact-motion>Brand Visuals &amp; Creative Content</span><span class="contact-studio-cn" data-contact-motion>\u54C1\u724C\u89C6\u89C9\u4E0E\u521B\u610F\u5185\u5BB9</span></p>
  </div>
  <dl class="contact-information">
   <div class="contact-information-row contact-email-row" data-contact-enter>
    <dt data-contact-motion>${t("Drop Us A Line","\u90AE\u4EF6\u8054\u7EDC")}</dt>
    <dd data-contact-motion>
     <a class="contact-value-link" href="mailto:contact@marvlore.com" aria-label="\u53D1\u9001\u90AE\u4EF6\u81F3 contact@marvlore.com">${n("contact@marvlore.com")}</a>
     <button class="contact-copy" type="button" data-copy-email aria-label="\u590D\u5236\u90AE\u7BB1\u4EE5\u8054\u7CFB\u8FC8\u7EDC"><span data-copy-label>Copy Email</span><span class="sr-only" data-copy-hint>\u590D\u5236\u90AE\u7BB1</span><svg class="contact-copy-check" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
     <span class="sr-only" data-copy-status role="status" aria-live="polite"></span>
    </dd>
   </div>
   <div class="contact-information-row" data-contact-enter>
    <dt data-contact-motion>${t("Let\u2019s Talk","\u7535\u8BDD\u8054\u7CFB")}</dt>
    <dd data-contact-motion><a class="contact-value-link" href="tel:+8619832866221" aria-label="\u62E8\u6253\u8FC8\u7EDC\u8054\u7CFB\u7535\u8BDD\uFF1A198 3286 6221">${n("198 3286 6221")}</a></dd>
   </div>
   <div class="contact-information-row" data-contact-enter>
    <dt data-contact-motion>${t("WeChat","\u5FAE\u4FE1")}</dt>
    <dd data-contact-motion><span class="contact-value-text">${n("marvloreM")}</span></dd>
   </div>
  </dl>
 </div>
 <div class="contact-footnote" data-contact-enter>
  <span data-contact-motion>\xA9 ${new Date().getFullYear()} MARVLORE \u8FC8\u7EDC</span>
  <a class="contact-back-top" href="#home" data-contact-motion>Back To Top <span aria-hidden="true">\u2191</span></a>
 </div>
</footer>`}export{o as renderContact};
