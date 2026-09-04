export const loadRemoteGreeting = async () => {
  const response = await fetch("https://greetings.invalid/latest");

  return response.status;
};
