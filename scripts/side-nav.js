const OFFSET = 75

$().ready(() => {
  /* 
  * TODO: Is this the right way to do mermaid stuff?
  * NOTE: There seems to be a x-platform issue (windows chrome output much larger than
  * macOS chrom output), so this is unused for now ... may need to pull out mermaid 
  * altogether - KCE Jun2020
  */
  if (document.querySelector('.mermaid')) {
    mermaid.initialize({
      startOnLoad: true,
      htmlLabels: true,
      sequence: {
        useMaxWidth: false,
      },
      mermaid: {
        callback: function(id) {
          renderSidebar();
        }
      }
    });
  } else {
    renderSidebar(); 
  }

})

function renderSidebar() {
    // HACK: we wait for repeats to get on screen and then hack them out
  // and then build a side nav
  removeRepeats();
  const wrapper = $('#side-nav')

  /**
   * @type  {Array<{link: El, offset: number}>}
   */
  const links = []

  if (!$('.vertical-section').length) {
    wrapper.hide()
  }

  // HACK: track refs, don't repeat (JSDoc repeats)
  // TODO: don't repeat content when JSDoc repeats
  let hrefs = [];
  $('.vertical-section').each((i, el) => {
    const section = $(el)
    const sectionName = section.find('> h1').text()
    if (sectionName) {
      let didFind = false;
      const list = $('<ul></ul>')
      // Look for members
      section.find('.members h4.name').each((i, el) => {
        const navLink = $(el)
        const name = navLink.find('.code-name')
          .clone().children().remove().end().text()
        const href = navLink.find('a').attr('href')
        if (hrefs.includes(href)) return
        didFind = true;
        hrefs.push(href)
        const link = $(`<a href="${href}" />`).text(name)
        list.append($('<li></li>').append(link))
        links.push({ link, offset: navLink.offset().top})
      })
      if (didFind) {
        wrapper.append($('<h3/>').text(sectionName))
        wrapper.append(list)
      } else {
        // Build TOC - assume we used static-content.tmpl so all is in one big
        // vertical-section
        let headers = section.find('h1, h2, h3');
        if (headers.length > 1) {
          headers.each( (index, element) => {
            element.classList.add('spec-header');
            let copy = element.cloneNode(true);
            copy.removeChild(copy.firstChild)
            const link = $(`<a href="#${element.id}">${copy.innerText}</a>`);
            const header = $(`<${element.tagName}></${element.tagName}>`);
            header.append(link);
            wrapper.append(header)
            links.push({ 
              link: link, 
              offset: $(element).offset().top
            })
          })
        }
      }
    }
    else {
      section.find('.members h4.name').each((i, el) => {
        const navLink = $(el)
        const name = navLink.find('.code-name')
          .clone().children().remove().end().text()
        const href = navLink.find('a').attr('href')
        if (hrefs.includes(href)) return
        hrefs.push(href)
        const link = $(`<a href="${href}" />`).text(name)
        wrapper.append(link)
        links.push({ link, offset: navLink.offset().top})
      })
    }
  })

  if (!$.trim(wrapper.text())) {
    return wrapper.hide()
  }

  const core = $('#main-content-wrapper')
  
  const selectOnScroll = () => {
    const position = core.scrollTop()
    let activeSet = false
    for (let index = (links.length-1); index >= 0; index--) {
      const link = links[index]
      link.link.removeClass('is-active')
      if ((position + OFFSET) >= link.offset) {
        if (!activeSet) {
          link.link.addClass('is-active')
          activeSet = true
        } else {
          link.link.addClass('is-past')
        }
      } else {
        link.link.removeClass('is-past')
      }
    }
  }
  core.on('scroll', selectOnScroll)

  selectOnScroll()

  links.forEach(link => {
    link.link.click(() => {
      core.animate({ scrollTop: link.offset - OFFSET + 1 }, 500)
    })
  })
}

// time to hack JSDoc to get rid of ugly outputs
// TODO: learn enough JSDoc to do this right.
function removeRepeats() {
  // 1. Please don't repeat the entire class definition just because of an overloaded constructor.
  // Do put the ctors into an array for later use
  let ctors = [];
  let contentNodes = Array.from(document.querySelectorAll('.core .content')[0].childNodes);
  let firstSectionIndex = contentNodes.findIndex( x => x.tagName === 'SECTION');
  if (firstSectionIndex > -1) {
    for (let index = 0; index < contentNodes.length; index++) {
      if(index >= firstSectionIndex) {
        let node = contentNodes[index];
        // Save the ctor 'member' chunk for later use
        if (node.tagName === "SECTION") {
          let ctorDesc = node.querySelector("article .container-overview .member");
          ctors.push(ctorDesc);
        }
        // don't remove the first one!
        if (index > firstSectionIndex) node.remove();
      }
    }
  }

  // 2. Do put those constructors together in the "container overview section".
  let members = document.querySelector('.core .content section article .container-overview .members');
  if (members && ctors.length > 0) {
    ctors.sort(byFormNumber);
    members.append(...ctors);
  }

  // 3. Don't repeat class name for overloaded constructors
  let subsectionTitles = Array.from(document.querySelectorAll('.subsection-title'));
  let classesTitle = subsectionTitles.find( x => x.textContent.toLowerCase() === "classes");
  if (classesTitle) {
    let siblings = Array.from(classesTitle.parentNode.children);
    let dl = siblings.find(s => s.tagName === "DL");
    let children = Array.from(dl.children);
    let childrenContents = children.map(c => c.textContent);
    let uniq = children.filter( (item, index) => {
      return childrenContents.indexOf(item.textContent) === index;
    });
    dl.innerHTML = '';
    dl.append(...uniq);
  }
}

// Assuming a JSDoc ctor description with the phrase "Form n" surrounded by whitespace, we sort `n` in descending order
function byFormNumber(a, b) {
  let formA, formB;
  let matchA = a.innerText.match(/\bForm (\d)\b/);
  let matchB = b.innerText.match(/\bForm (\d)\b/);
  if (matchA) {
    formA = Number(matchA[1]);
  }
  if (matchB) {
    formB = Number(matchB[1]);
  }
  if (!isNaN(formA) && !isNaN(formB)) {
    return numericCompare(formA, formB);
  } else if (!isNaN(formA)) {
    return 1;
  } else if (!isNaN(formB)) {
    return -1;
  } else {
    return 0;
  }
}

// This is how sort functions work.
function numericCompare( a, b ) {
  if ( a < b ) return -1;
  if ( a > b ) return 1;
  return 0;
}
