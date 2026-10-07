exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success: true,
      message: "MyHikaya — fonction Gemini prête."
    })
  };
};
