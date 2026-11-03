const chunkText = (text, totalWord, overlapWord) => {
  if (!text || !text.trim()) return [];

  const word = text.trim().split(/\s+/);
  let chunks=[];
  for (let i = 0; i < word.length; i += totalWord - overlapWord) {
    const data=word.slice(i,i+totalWord).join(" ");
    if (data) chunks.push(data);
  }

  return chunks;
};

export default chunkText;