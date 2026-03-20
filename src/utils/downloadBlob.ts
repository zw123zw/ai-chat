/**
 * POST请求下载文件，并修改文件名
 * @param  {Blob} blob
 * @param  {String} filename 想要保存的文件名称
 */

export default function downloadBlob(data: any, filename: string) {
  let blob = new Blob([data]);
  if (filename) {
    filename = decodeURIComponent(filename.replace(/\+/g, "%20"));
  }
  if ((window.navigator as any).msSaveOrOpenBlob) {
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    const body = document.querySelector("body");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    // fix Firefox
    link.style.display = "none";
    body?.appendChild(link);
    link.click();
    body?.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
