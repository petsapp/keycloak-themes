/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.20.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/Template/Template.tsx" --revert
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "@/login/components/ui/ThemeToggle";
import { redirectUrlOrigin } from "@/login/shared/redirectUrlOrigin";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useKcClsx } from "@keycloakify/login-ui/useKcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { RotateCcw, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { FiHome } from "react-icons/fi";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";
import { Languages } from "../ui/Langauges";
import petsAppLogo from "./../../assets/img/petsapp-logo-rounded.png";
import shape from "./../../assets/img/shape.svg";
import { useInitializeTemplate } from "./useInitializeTemplate";
import { useDynamicCss, useDynamicFavicon } from "../../hooks/useDynamicCss";

export function Template(props: {
  displayInfo?: boolean;
  displayMessage?: boolean;
  displayRequiredFields?: boolean;
  headerNode: ReactNode;
  socialProvidersNode?: ReactNode;
  infoNode?: ReactNode;
  documentTitle?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const {
    displayInfo = false,
    displayMessage = true,
    displayRequiredFields = false,
    headerNode,
    socialProvidersNode = null,
    infoNode = null,
    documentTitle,
    bodyClassName,
    children,
  } = props;

  const { kcContext } = useKcContext();

  const { auth, url, message, isAppInitiatedAction } = kcContext;

  const { msg, msgStr, enabledLanguages } = useI18n();

  const { kcClsx } = useKcClsx();

  const realmDisplayName = kcContext.realm.displayName || kcContext.realm.name;

  useEffect(() => {
    document.title =
      documentTitle ??
      msgStr("loginTitle", kcContext.realm.displayName || kcContext.realm.name);
  }, []);

  useSetClassName({
    qualifiedName: "html",
    className: kcClsx("kcHtmlClass"),
  });

  useSetClassName({
    qualifiedName: "body",
    className: bodyClassName ?? kcClsx("kcBodyClass"),
  });

  useInitializeTemplate();
  useDynamicCss(kcContext);
  useDynamicFavicon(kcContext);

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
      {/* Main content */}
      <div className="relative flex min-h-screen flex-col gap-4 bg-background px-0 py-0 pb-6 lg:min-h-0 lg:p-10">
        {/*  navigation */}
        <div className="absolute top-4 inset-s-4 z-20 flex gap-2">
          <Button type="button" variant="outline" size="icon" asChild>
            <a href={kcContext.client?.baseUrl ?? redirectUrlOrigin}>
              <FiHome />
            </a>
          </Button>

          {kcContext.darkMode !== false && <ModeToggle />}

          {enabledLanguages.length > 1 && <Languages />}
        </div>

        <div className="flex flex-1 items-center justify-center flex-col">
          <div className="w-full max-w-xl">
            <Card className="border-0 bg-transparent shadow-none sm:border sm:border-blue-100 sm:bg-card sm:shadow-xl sm:shadow-blue-950/5">
              <CardHeader>
                <CardTitle>
                  {/* Mobile header with logo */}
                  <div className="lg:hidden relative mt-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <img
                        src={petsAppLogo}
                        alt={realmDisplayName}
                        className="mb-8 size-20 rounded-[1.25rem] shadow-lg shadow-blue-950/15"
                      />
                    </div>
                  </div>
                  {(() => {
                    const node = !(
                      auth !== undefined &&
                      auth.showUsername &&
                      !auth.showResetCredentials
                    ) ? (
                      <h1 className="text-xl">{headerNode}</h1>
                    ) : (
                      <div
                        id="kc-username"
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex gap-4 items-center">
                          <User className="text-muted-foreground size-6" />

                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-normal text-muted-foreground">
                              {msgStr("attemptedUsernameLoggingInAs")}
                            </span>
                            <label
                              className="font-semibold text-lg"
                              id="kc-attempted-username"
                            >
                              {auth.attemptedUsername}
                            </label>
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" asChild>
                                <a
                                  id="reset-login"
                                  href={url.loginRestartFlowUrl}
                                  aria-label={msgStr("restartLoginTooltip")}
                                >
                                  <RotateCcw className="size-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{msg("restartLoginTooltip")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );

                    if (displayRequiredFields) {
                      return (
                        <div className="flex items-center justify-between gap-2">
                          <div>{node}</div>
                          <div>
                            <span className="subtitle">
                              <span className="text-destructive">*</span>
                              {msg("requiredFields")}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return node;
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div id="kc-content" className="space-y-4">
                  {displayMessage &&
                    message !== undefined &&
                    (message.type !== "warning" || !isAppInitiatedAction) && (
                      <Alert variant={message.type}>
                        <AlertDescription>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: kcSanitize(message.summary),
                            }}
                          />
                        </AlertDescription>
                      </Alert>
                    )}
                  {socialProvidersNode}
                  {children}
                  {auth !== undefined && auth.showTryAnotherWayLink && (
                    <form
                      id="kc-select-try-another-way-form"
                      action={url.loginAction}
                      method="post"
                    >
                      <div className={kcClsx("kcFormGroupClass")}>
                        <input type="hidden" name="tryAnotherWay" value="on" />

                        <Button
                          type="button"
                          className="w-full"
                          variant="outline"
                          asChild
                        >
                          <a
                            href="#"
                            id="try-another-way"
                            onClick={(event) => {
                              document.forms[
                                "kc-select-try-another-way-form" as never
                              ].submit();
                              event.preventDefault();
                              return false;
                            }}
                          >
                            {msg("doTryAnotherWay")}
                          </a>
                        </Button>
                      </div>
                    </form>
                  )}
                  {displayInfo && (
                    <div className="text-center text-sm">{infoNode}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
        <div className="absolute -right-24 -top-20 size-72 rounded-full bg-accent/90" />
        <div className="absolute -bottom-40 -left-28 size-96 rounded-full border-[3rem] border-white/10" />
        <div className="flex items-center pt-20 h-full justify-center z-1">
          <div className="absolute right-0 top-0 w-full max-w-62.5 opacity-25 mix-blend-screen xl:max-w-112.5">
            <img src={shape} alt="grid" />
          </div>
          <div className="absolute bottom-0 left-0 w-full max-w-62.5 rotate-180 opacity-25 mix-blend-screen xl:max-w-112.5">
            <img src={shape} alt="grid" />
          </div>

          <div className="relative z-10 flex max-w-sm flex-col items-center justify-center px-8 text-center">
            <div className="mb-8 rounded-[1.85rem] bg-white p-3 shadow-xl shadow-blue-950/20">
              <img
                src={petsAppLogo}
                alt={realmDisplayName}
                className="size-32 rounded-[1.35rem]"
              />
            </div>

            <p className="max-w-xs text-center text-lg leading-relaxed text-white/90">
              {msg("welcomeMessage")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
