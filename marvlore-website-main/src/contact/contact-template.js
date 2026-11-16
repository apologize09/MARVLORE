const label=(en,cn)=>`<span class="contact-label-main" aria-hidden="true">${en}<small>${cn}</small></span><span class="contact-label-emphasis" aria-hidden="true"><i></i><span>${en}</span></span><span class="sr-only">${en} · ${cn}</span>`;
const value=text=>`<span class="contact-value-main">${text}</span><span class="contact-value-large" aria-hidden="true"><span>${text}</span></span>`;
export function renderContact(){return `
<footer id="contact" class="contact contact-colophon screen" data-screen="08-contact" aria-labelledby="contact-title">
 <div class="contact-columns">
  <div class="contact-location">
   <h2 id="contact-title" data-contact-enter><span data-contact-motion>Get In Touch</span></h2>
   <p class="contact-welcome" data-contact-enter><span data-contact-motion>欢迎联络</span></p>
   <p class="contact-address" data-contact-enter><span data-contact-motion>Shenzhen,<br>China</span><span class="contact-address-cn" data-contact-motion>中国深圳</span></p>
   <p class="contact-studio-note" data-contact-enter><span data-contact-motion>Brand Visuals &amp; Creative Content</span><span class="contact-studio-cn" data-contact-motion>品牌视觉与创意内容</span></p>
  </div>
  <dl class="contact-information">
   <div class="contact-information-row contact-email-row" data-contact-enter>
    <dt data-contact-motion>${label('Drop Us A Line','邮件联络')}</dt>
    <dd data-contact-motion>
     <a class="contact-value-link" href="mailto:contact@marvlore.com" aria-label="发送邮件至 contact@marvlore.com">${value('contact@marvlore.com')}</a>
     <button class="contact-copy" type="button" data-copy-email aria-label="复制邮箱以联系迈络"><span data-copy-label>Copy Email</span><span class="sr-only" data-copy-hint>复制邮箱</span><svg class="contact-copy-check" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
     <span class="sr-only" data-copy-status role="status" aria-live="polite"></span>
    </dd>
   </div>
   <div class="contact-information-row" data-contact-enter>
    <dt data-contact-motion>${label('Let’s Talk','电话联系')}</dt>
    <dd data-contact-motion><a class="contact-value-link" href="tel:+8619832866221" aria-label="拨打迈络联系电话：198 3286 6221">${value('198 3286 6221')}</a></dd>
   </div>
   <div class="contact-information-row" data-contact-enter>
    <dt data-contact-motion>${label('WeChat','微信')}</dt>
    <dd data-contact-motion><span class="contact-value-text">${value('marvloreM')}</span></dd>
   </div>
  </dl>
 </div>
 <div class="contact-footnote" data-contact-enter>
  <span data-contact-motion>© ${new Date().getFullYear()} MARVLORE 迈络</span>
  <a class="contact-back-top" href="#home" data-contact-motion>Back To Top <span aria-hidden="true">↑</span></a>
 </div>
</footer>`;}
