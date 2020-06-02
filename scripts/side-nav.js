const OFFSET = 150

$().ready(() => {
  const wrapper = $('#side-nav')

  /**
   * @type  {Array<{link: El, offset: number}>}
   */
  const links = []

  if (!$('.vertical-section').length) {
    wrapper.hide()
  }

  let hrefs = [];
  $('.vertical-section').each((i, el) => {
    const section = $(el)
    const sectionName = section.find('> h1').text()
    if (sectionName) {
      let didFind = false;
      const list = $('<ul></ul>')
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
})