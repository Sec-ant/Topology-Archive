//jshint esversion: 8
(async () => {
  const maxID = 43890;
  let list = [];
  const downloadTextFile = function (fileName, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.setAttribute('download', fileName);
    a.setAttribute('href', window.URL.createObjectURL(blob));
    a.click();
  };
  const getInfo = async (start, stop) => {
    const domParser = new DOMParser();
    const promises = [];
    let count = 0;
    for (let id = start; id <= stop; ++id) {
      promises.push(fetch(`https://www.topology.com.tw/DataContent/graph/1/${id}`).then(resp => {
        if (resp.ok) {
          resp.text().then(domString => {
            const doc = domParser.parseFromString(domString, 'text/html');
            try {
              Array.from(
                Array.from(
                  doc.getElementsByClassName('widget_title')
                ).find(e => e.innerText.match(/相關/))
                  .parentElement
                  .getElementsByClassName('thumb_hover')
              ).forEach(e => {
                let [_, title, tid] = decodeURIComponent(e.firstElementChild.href).match(/graph\/([^\/]+)\/(\d+)/);
                tid = parseInt(tid);
                if (!list[tid]) {
                  list[tid] = {
                    id: tid,
                    title: title,
                    link: e.firstElementChild.firstElementChild.src,
                    referer: [id]
                  };
                } else {
                  list[tid].referer.push(id);
                }
              });
            } catch (err) { }
          });
        }
      }).finally(() => {
        ++count;
        if (count % 100 === 0) {
          console.log(count);
        }
      }));
      await new Promise(resolve => setTimeout(() => resolve(), Math.random() * 100 + 100));
    }
    return Promise.all(promises);
  };
  for (let ii = 0; ii <= maxID; ii = ii + 1000) {
    const jj = Math.min(ii + 999, maxID);
    console.log(`--- Range: ${ii} - ${jj} ---`);
    await getInfo(ii, jj);
  }
  list = list.filter(e => e);
  downloadTextFile(`list.json`, JSON.stringify(list));
  let readMe = '';
  for (let ii = 0; ii <= maxID; ii = ii + 1000) {
    let readMePartial = ``;
    const jj = Math.min(ii + 999, maxID);
    readMePartial = readMePartial + `### ID 范围： ${ii} - ${jj}\n`;
    readMePartial = readMePartial + '\n';
    readMePartial = readMePartial + '| ID | 页面 | 资源 | 被引 |\n';
    readMePartial = readMePartial + '| :-: | :-: | :-: | :-: |\n';
    readMePartial = readMePartial + list.filter(e => e.id >= ii && e.id <= jj).map(e => {
      const flag = e.link.match(/\.(gif|png|jpg|jpeg|bmp|webp)/i);
      return `| ${e.id} | [${e.title}](https://www.topology.com.tw/DataContent/graph/${encodeURIComponent(e.title)}/${e.id}) | ${flag ? '!' : ''}[${e.title}](${e.link}) | <span title="${e.referer.join(', ')}">${e.referer.length}</span> |`;
    }).join('\n');
    downloadTextFile(`${ii} - ${jj}.md`, readMePartial);
    readMe = readMe + readMePartial + '\n\n';
    await new Promise(resolve => setTimeout(() => resolve(), 500));
  }
  downloadTextFile(`list.md`, readMe);
})();