export async function askQwenCloud(promptMessage) {
  // Official Alibaba Cloud DashScope API endpoint
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Required Alibaba Cloud headers
      'Authorization': `Bearer ${process.env.ALIBABA_CLOUD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-turbo', // Official Alibaba Cloud model name
      input: {
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: promptMessage }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Alibaba Cloud API Error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.output.choices[0].message.content;
}