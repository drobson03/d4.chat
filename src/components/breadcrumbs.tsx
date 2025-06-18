import { isMatch, Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export const Breadcrumbs = () => {
  const matches = useMatches({
    select: (matches) =>
      matches.filter((match) => isMatch(match, "loaderData.crumb")),
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {matches.map((match, i) => {
          const title =
            typeof match.loaderData?.crumb === "object"
              ? match.loaderData?.crumb.title
              : match.loaderData?.crumb;
          const navigate =
            typeof match.loaderData?.crumb === "object"
              ? (match.loaderData?.crumb.navigate ?? true)
              : true;

          return (
            <Fragment key={match.id}>
              <BreadcrumbItem>
                {i === matches.length - 1 ? (
                  <BreadcrumbPage className="font-medium">
                    {title}
                  </BreadcrumbPage>
                ) : navigate ? (
                  <BreadcrumbLink asChild>
                    <Link to={match.fullPath}>{title}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {i < matches.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
