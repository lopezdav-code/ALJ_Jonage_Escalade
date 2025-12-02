const HELLOASSO_API_URL = '/api-helloasso/v5';
const OAUTH_URL = '/api-helloasso/oauth2/token';

export const authenticate = async (clientId, clientSecret, logger = console.log) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  logger(`[POST] ${OAUTH_URL} with client_id=${clientId}`);

  try {
    const response = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const text = await response.text();
      logger(`[ERROR] ${response.status} ${text}`);
      console.error('Authentication failed:', response.status, text);
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error_description || 'Authentication failed');
      } catch (e) {
        throw new Error(`Authentication failed: ${response.status} ${text}`);
      }
    }

    logger(`[SUCCESS] Authentication successful`);
    return response.json();
  } catch (error) {
    logger(`[FATAL] Network or other error: ${error.message}`);
    throw error;
  }
};

export const getOrders = async (accessToken, organizationSlug, pageIndex = 1, pageSize = 20, logger = console.log) => {
  const url = `${HELLOASSO_API_URL}/organizations/${organizationSlug}/orders?pageIndex=${pageIndex}&pageSize=${pageSize}&withDetails=true`;

  logger(`[GET] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger(`[ERROR] ${response.status} ${JSON.stringify(errorData)}`);
      throw new Error(errorData.message || 'Failed to fetch orders');
    }

    logger(`[SUCCESS] Orders fetched`);
    return response.json();
  } catch (error) {
    logger(`[FATAL] Network or other error: ${error.message}`);
    throw error;
  }
};

export const getForms = async (accessToken, organizationSlug, logger = console.log) => {
  const url = `${HELLOASSO_API_URL}/organizations/${organizationSlug}/forms`;

  logger(`[GET] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger(`[ERROR] ${response.status} ${JSON.stringify(errorData)}`);
      throw new Error(errorData.message || 'Failed to fetch forms');
    }

    logger(`[SUCCESS] Forms fetched`);
    return response.json();
  } catch (error) {
    logger(`[FATAL] Network or other error: ${error.message}`);
    throw error;
  }
};

export const getFormOrders = async (accessToken, organizationSlug, formType, formSlug, pageIndex = 1, pageSize = 20, logger = console.log) => {
  const url = `${HELLOASSO_API_URL}/organizations/${organizationSlug}/forms/${formType}/${formSlug}/orders?pageIndex=${pageIndex}&pageSize=${pageSize}&withDetails=true`;

  logger(`[GET] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger(`[ERROR] ${response.status} ${JSON.stringify(errorData)}`);
      throw new Error(errorData.message || 'Failed to fetch form orders');
    }

    logger(`[SUCCESS] Form orders fetched`);
    return response.json();
  } catch (error) {
    logger(`[FATAL] Network or other error: ${error.message}`);
    throw error;
  }
};
