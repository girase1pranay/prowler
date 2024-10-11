"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth.config";
import { getErrorMessage, parseStringify } from "@/lib";

export const getScans = async ({
  page = 1,
  query = "",
  sort = "",
  filters = {},
}) => {
  const session = await auth();

  if (isNaN(Number(page)) || page < 1) redirect("/scans");

  const keyServer = process.env.API_BASE_URL;
  const url = new URL(`${keyServer}/scans`);

  if (page) url.searchParams.append("page[number]", page.toString());
  if (query) url.searchParams.append("filter[search]", query);
  if (sort) url.searchParams.append("sort", sort);

  // Handle multiple filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "filter[search]") {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const scans = await fetch(url.toString(), {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
    });
    const data = await scans.json();
    const parsedData = parseStringify(data);
    revalidatePath("/scans");
    return parsedData;
  } catch (error) {
    console.error("Error fetching providers:", error);
    return undefined;
  }
};

export const scanOnDemand = async (formData: FormData) => {
  const session = await auth();
  const keyServer = process.env.API_BASE_URL;

  const providerId = formData.get("providerId");
  const scanName = formData.get("scanName");

  const url = new URL(`${keyServer}/scans`);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify({
        data: {
          type: "Scan",
          attributes: {
            name: scanName,
            scanner_args: {
              checks_to_execute: ["accessanalyzer_enabled"],
            },
          },
          relationships: {
            provider: {
              data: {
                type: "Provider",
                id: providerId,
              },
            },
          },
        },
      }),
    });
    const data = await response.json();
    revalidatePath("/scans");
    return parseStringify(data);
  } catch (error) {
    console.error(error);
    return {
      error: getErrorMessage(error),
    };
  }
};
