export const randomIndice = array => array[Math.floor(Math.random()*array.length)]
export const parseFromDb = string => {
  return {
    correctConjIndex: Number(string[0]),
    isException: string.substring(1) === 'true'
  }
}
export const stringifyToDb = (correctConjIndex, isException) => {
  // correctConjIndex must be number
  // isException must be boolean
  // if not fuck you because checking is too expensive
  return String(correctConjIndex)+String(isException)
}
