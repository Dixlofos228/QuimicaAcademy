/** Keep static URLs inside the current installation, including GitHub project Pages. */
export function assetUrl(path:string){return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;}

/** Full-resolution photos can live in a GitHub release without bloating Pages. */
export function originalPhotoUrl(id:number){
 const file=`${String(id).padStart(3,'0')}.jpg`;
 const remote=import.meta.env.VITE_ORIGINALS_BASE_URL as string|undefined;
 return remote?`${remote.replace(/\/+$/,'')}/${file}`:assetUrl(`originals/${file}`);
}
