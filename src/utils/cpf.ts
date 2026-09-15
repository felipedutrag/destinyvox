export function generateRandomCPF(): string {
  const randomDigit = () => Math.floor(Math.random() * 9);
  
  const calculateDigit = (arr: number[]) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i] * (arr.length + 1 - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const cpf = Array.from({ length: 9 }, randomDigit);
  cpf.push(calculateDigit(cpf));
  cpf.push(calculateDigit(cpf));

  return cpf.join("");
}
