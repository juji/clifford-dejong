
function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}


const increment = 0.001

const data = {
  keys: [],
  values: []
}

for(let i=0; i<=1;i+=increment){

  const key = `${ Math.round( i*10000 ) / 100 }%`
  const value = `{
    transform: scale3d(${easeOutElastic(i)},${easeOutElastic(i)},1);
  }`

  const index = data.values.findIndex(v => v === value)
  if(index === -1){
    data.keys.push(key)
    data.values.push(value)
  }else{
    data.keys[index] = data.keys[index]+','+key
  }

}

const lastKey = '100%'
const lastValue = `{
    transform: scale3d(1,1,1);
  }`

const index = data.values.findIndex(v => v === lastValue)
if(index === -1){
  data.keys.push(lastKey)
  data.values.push(lastValue)
}else{
  data.keys[index] = data.keys[index]+','+lastKey
}

let str = `@keyframes easeOutElastic {
`
for(let i=0; i<data.keys.length;i+=1){
  str += `  ${data.keys[i]} ${data.values[i]}
`
}

str += `
}`
console.log(str)